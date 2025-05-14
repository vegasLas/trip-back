import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { ensureUserExists } from './auth';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://t.me/your_app';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize the bot
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});


// Handle start command - Entry point for users
bot.onText(/\/start/, async (msg) => {
  try {
    if (!msg.from) {
      console.error('No from field in message');
      return;
    }

    const chatId = msg.chat.id;
    const telegramUser = {
      id: msg.from.id,
      first_name: msg.from.first_name,
      last_name: msg.from?.last_name,
      username: msg.from?.username,
      language_code: msg.from?.language_code,
    };

    // Create or update user in database
    const { user } = await ensureUserExists(telegramUser);

    let welcomeMessage = `Добро пожаловать, ${user.firstName}! `;
    
    if (user.guide) {
      welcomeMessage += 'Вы зарегистрированы как гид.';
    } else if (user.tourist) {
      welcomeMessage += 'Вы зарегистрированы как турист.';
    }

    // Create main menu with inline keyboard buttons for Mini App
    const keyboard = [
      [
        { text: '🗂 Программы', web_app: { url: `${MINI_APP_URL}?view=programs-main` } },
        { text: '📚 Бронирования', web_app: { url: `${MINI_APP_URL}?view=bookings-main` } },
      ],
      [
        { text: '🔨 Аукционы', web_app: { url: `${MINI_APP_URL}?view=auctions-main` } }
      ],
    ];

    // Add guide-specific options if user is a guide
    if (user.guide) {
      keyboard.push([
        { text: '📋 Мои программы', web_app: { url: `${MINI_APP_URL}?view=guide-programs` } },
        { text: '📊 Статистика', web_app: { url: `${MINI_APP_URL}?view=guide-statistics` } },
      ]);
    }

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } catch (error) {
    console.error('Error handling /start command:', error);
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже.');
  }
});

// Handle auth callback - Used when user opens Mini App
bot.on('web_app_data', async (msg) => {
  try {
    const chatId = msg.chat.id;
    
    if (!msg.web_app_data || !msg.from) {
      console.error('Missing web_app_data or from field in message');
      return;
    }
    
    const data = JSON.parse(msg.web_app_data.data);
    
    if (data.action === 'auth') {
      const telegramUser = {
        id: msg.from.id,
        first_name: msg.from.first_name,
        last_name: msg.from?.last_name,
        username: msg.from?.username,
        language_code: msg.from?.language_code,
      };
      
      // Ensure user exists
      await ensureUserExists(telegramUser);
      bot.sendMessage(chatId, 'Аутентификация успешна! Вы можете продолжить использование приложения.');
    }
  } catch (error) {
    console.error('Error handling web_app_data:', error);
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке данных. Пожалуйста, попробуйте позже.');
  }
});



// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Log received messages for debugging
bot.on('message', (msg) => {
  if (msg.from && msg.text) {
    console.log(`Received message from ${msg.from.id} (${msg.from.first_name}): ${msg.text}`);
  }
});

export default bot; 