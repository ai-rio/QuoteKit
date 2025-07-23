import { createTransport } from 'nodemailer';

import type { SMTPConfig } from './email-config';

export interface SMTPEmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface SMTPResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export class SMTPClient {
  private transporter;

  constructor(config: SMTPConfig) {
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      // In development with Inbucket, we don't need auth
      ...(process.env.NODE_ENV !== 'development' && {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
    });
  }

  async sendEmail(emailData: SMTPEmailData): Promise<SMTPResponse> {
    try {
      const info = await this.transporter.sendMail({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('SMTP Email Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMTP error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}