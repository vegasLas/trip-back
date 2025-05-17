import bot from '../bot';
import prisma from './prismaService';

// Send notification to a user by their base user ID
export const notifyUser = async (userId: number, message: string): Promise<boolean> => {
  try {
    // Get the user's Telegram ID
    const user = await prisma.baseUser.findUnique({
      where: { id: userId }
    });

    if (!user || !user.telegramId) {
      console.error(`Cannot send notification: User ${userId} not found or has no Telegram ID`);
      return false;
    }

    // Convert telegramId to chat ID (they are the same for private chats)
    const chatId = user.telegramId;
    
    // Send message
    await bot.sendMessage(chatId, message);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Send notification about guide approval status
export const notifyGuideApproval = async (userId: number, isApproved: boolean): Promise<boolean> => {
  const message = isApproved
    ? '🎉 Congratulations! Your guide profile has been approved. You can now access all guide features.'
    : '❌ Your guide profile has been rejected. Please contact support for more information.';
  
  return notifyUser(userId, message);
}; 