import { logger } from '../utils/logger.js';

export class EmailService {
  /**
   * Stub implementation for sending email messages.
   * Can be easily swapped with Nodemailer, SendGrid, or AWS SES in production.
   */
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // In development / testing, we log the email content to stdout
    logger.info(`✉️ Sending email to: ${to}`, {
      subject,
      body,
    });
    return true;
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    const subject = 'Verify your Sweatly account';
    const body = `Welcome to Sweatly! Please verify your email by clicking: ${verificationUrl}`;
    return this.sendEmail(email, subject, body);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    const subject = 'Reset your Sweatly password';
    const body = `We received a request to reset your password. Reset your password by clicking: ${resetUrl}`;
    return this.sendEmail(email, subject, body);
  }
}

export const emailService = new EmailService();
