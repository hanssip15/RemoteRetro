import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface ActionItem {
  task: string;
  assigneeName: string;
}

export interface EmailData {
  retroTitle: string;
  actionItems: ActionItem[];
  participantEmails: string[];
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    // For development, you can use Gmail or other SMTP services
    // For production, consider using services like SendGrid, AWS SES, etc.
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // For development - allows less secure apps
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendActionItemsEmail(emailData: EmailData): Promise<void> {
    const { retroTitle, actionItems, participantEmails } = emailData;

    // Create HTML content for the email
    const htmlContent = this.generateActionItemsEmailHTML(retroTitle, actionItems);

    // Send email to each participant
    for (const email of participantEmails) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_USER ,
          to: email,
          subject: `Action Items from Retrospective: ${retroTitle}`,
          html: htmlContent,
        });
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error);
        throw new Error(`Failed to send email to ${email}`);
      }
    }
  }

  private generateActionItemsEmailHTML(retroTitle: string, actionItems: ActionItem[]): string {
    const actionItemsHTML = actionItems
      .map((item, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 16px;">${item.task}</td>
          <td style="padding: 12px 16px; text-align: center;">${item.assigneeName}</td>
        </tr>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Items - ${retroTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .title { color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f3f4f6; padding: 12px 16px; text-align: left; font-weight: bold; }
          td { padding: 12px 16px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">🚀 Action Items</div>
            <div class="subtitle">Retrospective: ${retroTitle}</div>
          </div>
          
          <p>Hello! Here are the action items from your recent retrospective session:</p>
          
          <table>
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px 16px; text-align: center;">#</th>
                <th style="padding: 12px 16px;">Action Item</th>
                <th style="padding: 12px 16px; text-align: center;">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              ${actionItemsHTML}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This email was automatically generated from your RetroSprint session.</p>
            <p>Thank you for participating in the retrospective!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Method to test email configuration
  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
} 