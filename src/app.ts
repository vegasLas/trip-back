import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bot from './bot';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Setup Telegram bot webhook if WEBHOOK_URL is provided
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (WEBHOOK_URL && BOT_TOKEN) {
  const webhookPath = `/bot${BOT_TOKEN}`;
  
  // Process webhook requests from Telegram
  app.post(webhookPath, (req: Request, res: Response) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  console.log(`Telegram webhook endpoint set up at ${webhookPath}`);
}

// Import and use API routes (to be implemented)
// import userRoutes from './routes/userRoutes';
// import programRoutes from './routes/programRoutes';
// import bookingRoutes from './routes/bookingRoutes';
// import auctionRoutes from './routes/auctionRoutes';

// app.use('/api/users', userRoutes);
// app.use('/api/programs', programRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/auctions', auctionRoutes);

// Basic error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ 
    status: 'error', 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 middleware
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Resource not found' });
});

export default app;