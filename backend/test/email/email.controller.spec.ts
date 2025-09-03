import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from '../../src/controllers/email.controller';
import { EmailService, EmailData } from '../../src/services/email.service';
import { SendActionItemsEmailDto } from '../../src/controllers/email.controller';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: EmailService;

  const mockEmailService = {
    sendActionItemsEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: mockEmailService }],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get<EmailService>(EmailService);
  });
    beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // supress console.error
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendActionItemsEmail', () => {
    it('should send email successfully and return success message', async () => {
      const dto: SendActionItemsEmailDto = {
        retroTitle: 'Sprint 42 Retrospective',
        actionItems: [
          { task: 'Fix login bug', assigneeName: 'John Doe' },
          { task: 'Update documentation', assigneeName: 'Jane Doe' },
        ],
        participantEmails: ['user1@example.com', 'user2@example.com'],
      };

      mockEmailService.sendActionItemsEmail.mockResolvedValue(undefined);

      const result = await controller.sendActionItemsEmail(dto);

      expect(mockEmailService.sendActionItemsEmail).toHaveBeenCalledWith({
        retroTitle: dto.retroTitle,
        actionItems: dto.actionItems,
        participantEmails: dto.participantEmails,
      } as EmailData);

      expect(result).toEqual({
        success: true,
        message: `Action items email sent to ${dto.participantEmails.length} participants`,
        sentTo: dto.participantEmails,
      });
    });

    it('should throw error when emailService fails', async () => {
      const dto: SendActionItemsEmailDto = {
        retroTitle: 'Sprint 42 Retrospective',
        actionItems: [
          { task: 'Fix login bug', assigneeName: 'John Doe' },
        ],
        participantEmails: ['user1@example.com'],
      };

      mockEmailService.sendActionItemsEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(controller.sendActionItemsEmail(dto)).rejects.toThrow(
        'Failed to send action items email: SMTP error',
      );
    });
  });
});
