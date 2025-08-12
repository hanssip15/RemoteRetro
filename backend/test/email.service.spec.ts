import { Test, TestingModule } from '@nestjs/testing';
import { EmailService, EmailData } from '../src/services/email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const sendMailMock = jest.fn();
const verifyMock = jest.fn();

(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: sendMailMock,
  verify: verifyMock,
});

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    sendMailMock.mockClear();
    verifyMock.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('sendActionItemsEmail', () => {
    it('should send emails to all participants', async () => {
      sendMailMock.mockResolvedValue({});

      const data: EmailData = {
        retroTitle: 'Sprint 1 Retrospective',
        actionItems: [
          { task: 'Improve deployment time', assigneeName: 'Alice' },
          { task: 'Review code guidelines', assigneeName: 'Bob' },
        ],
        participantEmails: ['alice@example.com', 'bob@example.com'],
      };

      await service.sendActionItemsEmail(data);

      expect(sendMailMock).toHaveBeenCalledTimes(2);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@example.com',
          subject: expect.stringContaining(data.retroTitle),
          html: expect.any(String),
        })
      );
    });

    it('should throw error if email sending fails', async () => {
      sendMailMock.mockRejectedValue(new Error('SMTP error'));

      const data: EmailData = {
        retroTitle: 'Sprint 2',
        actionItems: [{ task: 'Fix bug #42', assigneeName: 'Charlie' }],
        participantEmails: ['mochamadfathurrabbani@example.com'],
      };

      await expect(service.sendActionItemsEmail(data)).rejects.toThrow(
        'Failed to send email to mochamadfathurrabbani@example.com'
      );
    });
  });

  describe('testEmailConnection', () => {
    it('should return true when verify succeeds', async () => {
      verifyMock.mockResolvedValue(true);
      const result = await service.testEmailConnection();
      expect(result).toBe(true);
    });

    it('should return false when verify fails', async () => {
      verifyMock.mockRejectedValue(new Error('Connection error'));
      const result = await service.testEmailConnection();
      expect(result).toBe(false);
    });
  });
});
