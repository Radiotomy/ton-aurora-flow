import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Telegram webhook - only accepts requests from Telegram servers
// We don't use standard CORS here as this is a webhook endpoint

// Telegram update schema
const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      first_name: z.string(),
      last_name: z.string().optional(),
      username: z.string().optional(),
    }),
    chat: z.object({
      id: z.number(),
      type: z.enum(['private', 'group', 'supergroup', 'channel']),
    }),
    date: z.number(),
    text: z.string().optional(),
  }).optional(),
});

const webAppUrl = 'https://audioton.co';

// Send message via Telegram Bot API
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  options?: any
) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      }),
    }
  );
  
  if (!response.ok) {
    console.error('Telegram API error');
    throw new Error('Failed to send message');
  }
  
  return response.json();
}

// Handle bot commands
async function handleCommand(
  botToken: string,
  command: string,
  chatId: number,
  userId: number
) {
  console.log(`Processing command: ${command} for user ${userId}`);

  switch (command) {
    case '/start':
      await sendTelegramMessage(
        botToken,
        chatId,
        `🎵 <b>Welcome to AudioTon!</b>

Discover, stream, and collect exclusive music NFTs on the TON blockchain.

🚀 Tap the button below to launch the app:`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎵 Launch AudioTon',
                web_app: { url: webAppUrl }
              }
            ]]
          }
        }
      );
      break;

    case '/wallet':
      await sendTelegramMessage(
        botToken,
        chatId,
        `💰 <b>Connect Your TON Wallet</b>

Connect your wallet to start collecting music NFTs and supporting artists!

Launch the app to connect securely.`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🔗 Connect Wallet',
                web_app: { url: `${webAppUrl}/?action=connect-wallet` }
              }
            ]]
          }
        }
      );
      break;

    case '/discover':
      await sendTelegramMessage(
        botToken,
        chatId,
        `🎧 <b>Discover Amazing Music</b>

Explore trending tracks, exclusive drops, and live events from talented artists.`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎵 Discover Music',
                web_app: { url: `${webAppUrl}/discover` }
              }
            ]]
          }
        }
      );
      break;

    case '/profile':
      await sendTelegramMessage(
        botToken,
        chatId,
        `👤 <b>Your AudioTon Profile</b>

View your NFT collection, playlists, and activity.`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '👤 Open Profile',
                web_app: { url: `${webAppUrl}/dashboard` }
              }
            ]]
          }
        }
      );
      break;

    case '/help':
      await sendTelegramMessage(
        botToken,
        chatId,
        `❓ <b>AudioTon Help</b>

<b>Features:</b>
• 🎵 Stream music from Audius
• 💎 Collect exclusive NFTs
• 💰 Support artists with TON tips
• 🎪 Join live events and fan clubs
• 🗳️ Participate in community polls

<b>Commands:</b>
/start - Launch AudioTon
/wallet - Connect TON wallet
/discover - Browse music
/profile - View your profile
/help - Show this help message

<b>Need support?</b>
Join our community: @audioton_community`
      );
      break;

    default:
      await sendTelegramMessage(
        botToken,
        chatId,
        `❓ Unknown command. Use /help to see available commands.`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎵 Launch AudioTon',
                web_app: { url: webAppUrl }
              }
            ]]
          }
        }
      );
  }
}

Deno.serve(async (req) => {
  // Telegram webhooks should only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 405 
      }
    );
  }

  try {
    const botToken = Deno.env.get('Bot_Token');
    if (!botToken) {
      throw new Error('Bot token not configured');
    }

    // Parse incoming update
    const update = await req.json();
    console.log('Received Telegram update');

    // Validate update structure
    const validatedUpdate = TelegramUpdateSchema.parse(update);

    // Process message if present
    if (validatedUpdate.message?.text) {
      const { message } = validatedUpdate;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text;

      // Check if it's a command
      if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();
        await handleCommand(botToken, command, chatId, userId);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Webhook error');
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed'
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 // Return 200 to acknowledge receipt even on errors
      }
    );
  }
});
