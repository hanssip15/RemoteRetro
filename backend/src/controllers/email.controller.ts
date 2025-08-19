import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService, EmailData } from '../services/email.service';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray,ArrayMinSize,ValidateNested,IsEmail} from 'class-validator';
import { Type } from 'class-transformer';

class ActionItemDto {
  @ApiProperty({ description: 'Task description', example: 'Fix login bug' })
  @IsString()
  @IsNotEmpty()
  task: string;

  @ApiProperty({ description: 'Name of the person assigned to the task', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  assigneeName: string;
}

export class SendActionItemsEmailDto {
  @ApiProperty({ description: 'Title of the retro', example: 'Sprint 42 Retrospective' })
  @IsString()
  @IsNotEmpty()
  retroTitle: string;

  @ApiProperty({ description: 'List of action items for the retrospective', type: [ActionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActionItemDto)
  actionItems: ActionItemDto[];

  @ApiProperty({ description: 'List of participant emails', example: ['user1@example.com', 'user2@example.com'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  participantEmails: string[];
}
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('/v1/items/send-action-items')
  @ApiOperation({ summary: 'Send action items email to participants' })
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


} 