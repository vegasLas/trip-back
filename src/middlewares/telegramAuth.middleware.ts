import { validate, parse, type InitData } from '@telegram-apps/init-data-node';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Add type declaration for augmented Express Request
// declare global {
//   namespace Express {
//     interface Request {
//       initData?: InitData;
//     }
//   }
// }

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const telegramAuthMiddleware = (async (req: Request, res: Response, next: NextFunction) => {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not configured in .env file.');
    return res.status(500).json({ message: 'Server configuration error: Bot token missing.' });
  }

  const authorizationHeader = req.header('authorization');
  if (!authorizationHeader) {
    return res.status(401).json({ message: 'Unauthorized: Missing Authorization header.' });
  }

  const [authType, authData = ''] = authorizationHeader.split(' ');

  if (authType?.toLowerCase() !== 'tma' || !authData) {
    return res.status(401).json({ message: 'Unauthorized: Invalid Authorization header format. Expected "tma <initData>".' });
  }

  try {
    // 1. Validate init data signature and expiration
    validate(authData, BOT_TOKEN, {
      expiresIn: 3600, // Consider init data valid for 1 hour
    });

    // 2. Parse init data and store it in the request
    const parsedInitData: InitData = parse(authData);
    req.initData = parsedInitData;

    return next();
  } catch (e: any) {
    // Log the detailed error for server-side inspection
    console.error('Telegram Auth Middleware Error:', e);

    // Provide a generic error message to the client for security
    if (e.message && (e.message.toLowerCase().includes('validation failed') || e.message.toLowerCase().includes('expired'))) {
        return res.status(401).json({ message: `Unauthorized: ${e.message}` });
    }
    
    return res.status(500).json({ message: 'Server error during authentication process.' });
  }
}) as RequestHandler; 