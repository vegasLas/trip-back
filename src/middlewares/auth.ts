import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { ForbiddenError } from '../utils/errors';
import { validate, parse, type InitData } from '@telegram-apps/init-data-node';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Extend Express Request type to include user and initData
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        telegramId: string;
        role: UserRole;
        isTourist?: boolean;
        isGuide?: boolean;
        isAdmin?: boolean;
        isSuperAdmin?: boolean;
      };
      initData?: InitData;
    }
  }
}

/**
 * Middleware that validates Telegram init data and loads user information
 * This handles the "tma" authorization format
 */
export const validateTelegramAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured in .env file.');
      res.status(500).json({ message: 'Server configuration error: Bot token missing.' });
      return;
    }
    
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Unauthorized: Missing authorization header.' });
      return;
    }
    
    let telegramId: string;
    let initData: string;
    
    if (authHeader.toLowerCase().startsWith('tma ')) {
      initData = authHeader.split(' ')[1];
    }
    else {
      res.status(401).json({ 
        message: 'Unauthorized: Invalid authorization header format. Expected "tma <initData>".' 
      });
      return;
    }
    
    try {
      // Validate the init data
      validate(initData, BOT_TOKEN, {
        expiresIn: 3600, // Consider init data valid for 1 hour
      });
      
      // Parse the init data to extract user information
      const parsedInitData: InitData = parse(initData);
      req.initData = parsedInitData;
      
      if (!parsedInitData.user || !parsedInitData.user.id) {
        res.status(401).json({ message: 'Unauthorized: Invalid user data in Telegram init data.' });
        return;
      }
      
      // Extract Telegram ID from the parsed data
      telegramId = parsedInitData.user.id.toString();
    } catch (e: any) {
      // Handle Telegram validation errors
      console.error('Telegram Auth Error:', e);
      
      if (e.message && (e.message.toLowerCase().includes('validation failed') || 
                       e.message.toLowerCase().includes('expired'))) {
        res.status(401).json({ message: `Unauthorized: ${e.message}` });
      } else {
        res.status(500).json({ message: 'Server error during authentication process.' });
      }
      return;
    }
    
    try {
      // Find the user in the database
      const baseUser = await prisma.baseUser.findUnique({
        where: { telegramId },
        include: {
          tourist: true,
          guide: true,
          admin: true
        }
      });
      
      if (!baseUser) {
        res.status(401).json({ message: 'Unauthorized: User not found.' });
        return;
      }
      
      // Set user in request with role-based flags
      req.user = {
        id: baseUser.id,
        telegramId: baseUser.telegramId,
        role: baseUser.role,
        isTourist: baseUser.role === UserRole.TOURIST,
        isGuide: baseUser.role === UserRole.GUIDE,
        isAdmin: baseUser.role === UserRole.ADMIN || baseUser.role === UserRole.SUPER_ADMIN,
        isSuperAdmin: baseUser.role === UserRole.SUPER_ADMIN
      };
      
      next();
    } catch (dbError) {
      console.error('Database Error during authentication:', dbError);
      res.status(500).json({ message: 'Server error while retrieving user data.' });
      return;
    }
  } catch (error: any) {
    // Catch any other unexpected errors
    console.error('Unexpected Authentication Error:', error);
    res.status(500).json({ message: 'Internal server error during authentication.' });
    return;
  }
};

// Middleware to require tourist role
export const requireTourist = (
  req: Request,
  _: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== UserRole.TOURIST) {
    next(new ForbiddenError('Tourist access required'));
    return;
  }
  next();
};

// Middleware to require guide role
export const requireGuide = async (
  req: Request,
  _: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.GUIDE) {
    next(new ForbiddenError('Guide access required'));
    return;
  }
  
  // Check if the guide is approved
  try {
    const guide = await prisma.guide.findFirst({
      where: {
        baseUser: {
          id: req.user.id
        }
      }
    });
    
    if (!guide || !guide.isApproved) {
      next(new ForbiddenError('Your guide profile is pending approval by an admin'));
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error checking guide approval status:', error);
    next(new ForbiddenError('Failed to verify guide approval status'));
    return;
  }
};

// Middleware to require admin role
export const requireAdmin = (
  req: Request,
  _: Response,
  next: NextFunction
): void => {
  if (!req.user || !(req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN)) {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
};

// Middleware to require super admin role
export const requireSuperAdmin = (
  req: Request,
  _: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    next(new ForbiddenError('Super admin access required'));
    return;
  }
  next();
}; 