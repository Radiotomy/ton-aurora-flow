/**
 * Telegram Bot Service for AudioTon Production Launch
 * Handles Telegram Web App integration and bot commands
 */

import { APP_CONFIG } from '@/config/production';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface WebAppData {
  user: TelegramUser;
  chat_instance: string;
  chat_type: 'sender' | 'private' | 'group' | 'supergroup' | 'channel';
  auth_date: number;
  hash: string;
}

export class TelegramBotService {
  private static botToken = APP_CONFIG.TELEGRAM.BOT_TOKEN;
  private static webAppUrl = APP_CONFIG.TELEGRAM.WEB_APP_URL;

  /**
   * Initialize Telegram Web App
   */
  static initWebApp(): boolean {
    try {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        console.warn('Telegram Web App not available');
        return false;
      }

      const tg = window.Telegram.WebApp;
      
      // Configure Web App
      tg.ready();
      tg.expand();
      
      // Set theme parameters
      if (APP_CONFIG.TELEGRAM.THEME_PARAMS) {
        tg.headerColor = 'secondary_bg_color';
        tg.backgroundColor = 'bg_color';
      }

      // Enable haptic feedback
      if (APP_CONFIG.TELEGRAM.HAPTIC_FEEDBACK && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }

      console.log('Telegram Web App initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Telegram Web App:', error);
      return false;
    }
  }

  /**
   * Validate Telegram Web App data
   */
  static validateWebAppData(initData: string): boolean {
    try {
      // Parse init data
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) {
        return false;
      }

      // Remove hash from params for validation
      urlParams.delete('hash');
      
      // Sort parameters
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Validate hash (simplified - in production use proper HMAC validation)
      console.log('Validating Telegram data:', dataCheckString);
      
      return true; // For development - implement proper validation in production
    } catch (error) {
      console.error('Telegram data validation failed:', error);
      return false;
    }
  }

  /**
   * Get user data from Telegram Web App
   */
  static getUserData(): TelegramUser | null {
    try {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
        return null;
      }

      return window.Telegram.WebApp.initDataUnsafe.user;
    } catch (error) {
      console.error('Failed to get Telegram user data:', error);
      return null;
    }
  }

  /**
   * Send notification via Telegram Bot
   */
  static async sendNotification(
    chatId: number,
    message: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown';
      disable_web_page_preview?: boolean;
      reply_markup?: any;
    }
  ): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.warn('Telegram bot token not configured');
        return false;
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          ...options,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
      return false;
    }
  }

  /**
   * Set up bot commands for production
   */
  static async setupBotCommands(): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.warn('Telegram bot token not configured');
        return false;
      }

      const commands = [
        {
          command: 'start',
          description: 'Launch AudioTon Web App'
        },
        {
          command: 'wallet',
          description: 'Connect your TON wallet'
        },
        {
          command: 'discover',
          description: 'Discover new music'
        },
        {
          command: 'profile',
          description: 'View your profile'
        },
        {
          command: 'help',
          description: 'Get help and support'
        }
      ];

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to setup bot commands:', error);
      return false;
    }
  }

  /**
   * Handle incoming bot commands
   */
  static async handleBotCommand(
    command: string,
    chatId: number,
    userId: number
  ): Promise<void> {
    try {
      switch (command) {
        case '/start':
          await this.sendNotification(chatId, 
            `🎵 Welcome to AudioTon! 

Discover, stream, and collect exclusive music NFTs on the TON blockchain.

🚀 Tap the button below to launch the app:`, 
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🎵 Launch AudioTon',
                    web_app: { url: this.webAppUrl }
                  }
                ]]
              }
            }
          );
          break;

        case '/wallet':
          await this.sendNotification(chatId,
            `💰 Connect your TON wallet to start collecting music NFTs and supporting artists!

Launch the app to connect your wallet securely.`,
            {
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🔗 Connect Wallet',
                    web_app: { url: `${this.webAppUrl}/?action=connect-wallet` }
                  }
                ]]
              }
            }
          );
          break;

        case '/discover':
          await this.sendNotification(chatId,
            `🎧 Discover amazing artists and exclusive tracks on AudioTon!

Explore trending music, exclusive drops, and live events.`,
            {
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🎵 Discover Music',
                    web_app: { url: `${this.webAppUrl}/?action=discover` }
                  }
                ]]
              }
            }
          );
          break;

        case '/help':
          await this.sendNotification(chatId,
            `❓ <b>AudioTon Help</b>

<b>Features:</b>
• 🎵 Stream music from Audius
• 💎 Collect exclusive NFTs
• 💰 Support artists with TON tips
• 🎪 Join live events and fan clubs
• 🗳️ Participate in community polls

<b>Need support?</b>
Join our community: @audioton_community`,
            { parse_mode: 'HTML' }
          );
          break;

        default:
          await this.sendNotification(chatId,
            `Unknown command. Use /help to see available commands.`
          );
      }
    } catch (error) {
      console.error('Error handling bot command:', error);
    }
  }

  /**
   * Show main button with custom action
   */
  static showMainButton(text: string, callback: () => void): void {
    try {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        return;
      }

      const tg = window.Telegram.WebApp;
      
      tg.MainButton.setText(text);
      tg.MainButton.show();
      tg.MainButton.onClick(callback);
    } catch (error) {
      console.error('Failed to show main button:', error);
    }
  }

  /**
   * Hide main button
   */
  static hideMainButton(): void {
    try {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        return;
      }

      window.Telegram.WebApp.MainButton.hide();
    } catch (error) {
      console.error('Failed to hide main button:', error);
    }
  }

  /**
   * Trigger haptic feedback
   */
  static hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' = 'light'): void {
    try {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp?.HapticFeedback) {
        return;
      }

      const haptic = window.Telegram.WebApp.HapticFeedback;
      
      switch (type) {
        case 'error':
          haptic.notificationOccurred('error');
          break;
        case 'success':
          haptic.notificationOccurred('success');
          break;
        case 'warning':
          haptic.notificationOccurred('warning');
          break;
        default:
          haptic.impactOccurred(type);
      }
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  }
}

// Auto-initialize when running in Telegram
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  TelegramBotService.initWebApp();
}