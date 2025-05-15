import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
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
        isTourist?: boolean;
        isGuide?: boolean;
        isAdmin?: boolean;
      };
      initData?: InitData;
    }
  }
}

/**
 * Middleware that validates Telegram init data and loads user information
 * This handles both "TelegramWebApp" and "tma" authorization formats
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
        message: 'Unauthorized: Invalid authorization header format. Expected "TelegramWebApp <initData>" or "tma <initData>".' 
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
        }
      });
      
      if (!baseUser) {
        res.status(401).json({ message: 'Unauthorized: User not found.' });
        return;
      }
      
      // Check if user is an admin
      const adminTelegramIds = process.env.ADMIN_TELEGRAM_IDS?.split(',') || [];
      const isAdmin = adminTelegramIds.includes(telegramId);
      
      // Set user in request
      req.user = {
        id: baseUser.id,
        telegramId: baseUser.telegramId,
        isTourist: !!baseUser.guide === false,
        isGuide: !!baseUser.guide,
        isAdmin: isAdmin,
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
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isTourist) {
    next(new ForbiddenError('Tourist access required'));
    return;
  }
  next();
};

// Middleware to require guide role
export const requireGuide = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isGuide) {
    next(new ForbiddenError('Guide access required'));
    return;
  }
  next();
};

// Middleware to require admin role
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin) {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
}; 