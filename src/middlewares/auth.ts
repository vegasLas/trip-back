import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

// Extend Express Request type to include user
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
    }
  }
}

// Middleware to validate Telegram init data
export const validateTelegramAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('TelegramWebApp ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    // Extract and validate Telegram init data
    // TODO: Implement actual Telegram init data validation logic
    const initData = authHeader.split(' ')[1];
    
    // For now, just extract Telegram ID from a dummy token
    // In a real implementation, we would validate data signature using bot token
    const telegramId = '123456789'; // Placeholder
    
    // Find or create the user
    const baseUser = await prisma.baseUser.findUnique({
      where: { telegramId },
      include: {
        tourist: true,
        guide: true,
      }
    });
    
    if (!baseUser) {
      throw new UnauthorizedError('User not found');
    }
    
    // Set user in request
    req.user = {
      id: baseUser.id,
      telegramId: baseUser.telegramId,
      isTourist: !!baseUser.tourist,
      isGuide: !!baseUser.guide,
      isAdmin: false, // TODO: Implement admin check
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to require tourist role
export const requireTourist = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.isTourist) {
    return next(new ForbiddenError('Tourist access required'));
  }
  next();
};

// Middleware to require guide role
export const requireGuide = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.isGuide) {
    return next(new ForbiddenError('Guide access required'));
  }
  next();
};

// Middleware to require admin role
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.isAdmin) {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}; 