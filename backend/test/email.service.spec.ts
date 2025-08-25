// src/email/email.service.spec.ts
import { EmailService, EmailData } from '../src/services/email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSendMail: jest.Mock;
  let mockVerify: jest.Mock;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue(true);
    mockVerify = jest.fn().mockResolvedValue(true);

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
      verify: mockVerify,
    });

    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendActionItemsEmail', () => {
    const emailData: EmailData = {
      retroTitle: 'Sprint 1',
      actionItems: [
        { task: 'Fix bug #123', assigneeName: 'Alice' },
        { task: 'Refactor login service', assigneeName: 'Bob' },
      ],
      participantEmails: ['test1@example.com', 'test2@example.com'],
    };

    it('should send emails to all participants', async () => {
      await emailService.sendActionItemsEmail(emailData);

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test1@example.com',
          subject: `Action Items from Retrospective: Sprint 1`,
        }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test2@example.com',
        }),
      );
    });

    it('should throw error if sendMail fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(emailService.sendActionItemsEmail(emailData)).rejects.toThrow(
        'Failed to send email to test1@example.com',
      );
    });
  });

  describe('generateActionItemsEmailHTML', () => {
    it('should generate HTML string containing action items', () => {
      const html = (emailService as any).generateActionItemsEmailHTML('Retro X', [
        { task: 'Do something', assigneeName: 'Alice' },
      ]);

      expect(html).toContain('Retro X');
      expect(html).toContain('Do something');
      expect(html).toContain('Alice');
    });
  });

});
