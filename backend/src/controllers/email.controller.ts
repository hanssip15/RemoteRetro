import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService, EmailData } from '../services/email.service';

export interface SendActionItemsEmailDto {
  retroId: string;
  retroTitle: string;
  actionItems: Array<{
    task: string;
    assigneeName: string;
  }>;
  participantEmails: string[];
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-action-items')
  @HttpCode(HttpStatus.OK)
  async sendActionItemsEmail(@Body() emailData: SendActionItemsEmailDto) {
    try {
      const emailPayload: EmailData = {
        retroTitle: emailData.retroTitle,
        actionItems: emailData.actionItems,
        participantEmails: emailData.participantEmails,
      };

      await this.emailService.sendActionItemsEmail(emailPayload);
      
      return {
        success: true,
        message: `Action items email sent to ${emailData.participantEmails.length} participants`,
        sentTo: emailData.participantEmails,
      };
    } catch (error) {
      console.error('Failed to send action items email:', error);
      throw new Error(`Failed to send action items email: ${error.message}`);
    }
  }

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  async testEmailConnection() {
    try {
      const isConnected = await this.emailService.testEmailConnection();
      return {
        success: isConnected,
        message: isConnected ? 'Email service is properly configured' : 'Email service configuration error',
      };
    } catch (error) {
      console.error('Email connection test failed:', error);
      return {
        success: false,
        message: `Email connection test failed: ${error.message}`,
      };
    }
  }
} 