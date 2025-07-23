interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
}

interface ResendConfig {
  apiKey: string;
}

interface EmailConfig {
  provider: 'smtp' | 'resend';
  smtp?: SMTPConfig;
  resend?: ResendConfig;
}

export function getEmailConfig(): EmailConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Use Inbucket SMTP in development
    return {
      provider: 'smtp',
      smtp: {
        host: '127.0.0.1',
        port: 2500, // Inbucket SMTP port
        secure: false,
        requireTLS: false,
      },
    };
  }

  // Use Resend in production
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required in production');
  }

  return {
    provider: 'resend',
    resend: {
      apiKey,
    },
  };
}

export type { EmailConfig, ResendConfig,SMTPConfig };