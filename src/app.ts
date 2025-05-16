import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bot from './bot';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

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

// Mount API routes
app.use('/api', apiRoutes);

// Global error handling middleware
app.use(errorHandler);

// 404 middleware - this should be after all routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Resource not found' });
});

export default app;