import { registerAs } from '@nestjs/config';

export const notificationConfig = registerAs('notification', () => ({
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'noreply@buildtrack.lk',
    fromName: process.env.SMTP_FROM_NAME || 'BuildTrack',
  },
  whatsapp: {
    accountSid: process.env.WHATSAPP_ACCOUNT_SID,
    authToken: process.env.WHATSAPP_AUTH_TOKEN,
    from: process.env.WHATSAPP_FROM,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
}));
