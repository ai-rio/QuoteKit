import { render } from '@react-email/components';

import { resendClient } from '../resend/resend-client';
import { getEmailConfig } from './email-config';
import { SMTPClient, type SMTPEmailData, type SMTPResponse } from './smtp-client';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  component: React.ReactElement;
  attachments?: EmailAttachment[];
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

class EmailService {
  private config = getEmailConfig();

  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      const html = await render(emailData.component);

      if (this.config.provider === 'smtp' && this.config.smtp) {
        return this.sendViaSMTP(emailData, html);
      } else if (this.config.provider === 'resend' && this.config.resend) {
        return this.sendViaResend(emailData, html);
      } else {
        throw new Error('Invalid email configuration');
      }
    } catch (error) {
      console.error('Email Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async sendViaSMTP(emailData: EmailData, html: string): Promise<EmailResponse> {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration not available');
    }

    const smtpClient = new SMTPClient(this.config.smtp);
    
    const smtpData: SMTPEmailData = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html,
      attachments: emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    };

    return smtpClient.sendEmail(smtpData);
  }

  private async sendViaResend(emailData: EmailData, html: string): Promise<EmailResponse> {
    try {
      const response = await resendClient.emails.send({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      return {
        success: true,
        messageId: response.data?.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Resend Email Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resend API error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const emailService = new EmailService();