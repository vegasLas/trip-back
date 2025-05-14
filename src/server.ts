import app from './app';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Set port
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  });
});

export default server;