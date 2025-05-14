import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// Create or update user in database based on Telegram user data
export async function ensureUserExists(telegramUser: TelegramUser) {
  try {
    // Check if user exists
    let baseUser = await prisma.baseUser.findUnique({
      where: { telegramId: telegramUser.id.toString() },
      include: { tourist: true, guide: true }
    });

    // Create user if doesn't exist
    if (!baseUser) {
      baseUser = await prisma.baseUser.create({
        data: {
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || null,
          username: telegramUser.username || null,
          languageCode: telegramUser.language_code || null,
          tourist: {
            create: {}  // By default, create as tourist
          }
        },
        include: { tourist: true, guide: true }
      });
    }
    
    return { user: baseUser };
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}
