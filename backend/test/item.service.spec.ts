import { Test, TestingModule } from '@nestjs/testing';
import { RetroItemsService } from '../src/services/item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RetroItem, RetroFormatTypes } from '../src/entities/retro-item.entity';
import { Retro } from '../src/entities/retro.entity';
import { Participant } from '../src/entities/participant.entity';
import { ParticipantGateway } from '../src/gateways/participant.gateways';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('RetroItemsService', () => {
  let service: RetroItemsService;
  let retroItemRepo: any;
  let retroRepo: any;
  let participantRepo: any;
  let gateway: any;

  beforeEach(async () => {
    retroItemRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };
    retroRepo = { findOne: jest.fn() };
    participantRepo = { findOne: jest.fn() };
    gateway = {
      broadcastItemAdded: jest.fn(),
      broadcastItemUpdated: jest.fn(),
      broadcastItemDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetroItemsService,
        { provide: getRepositoryToken(RetroItem), useValue: retroItemRepo },
        { provide: getRepositoryToken(Retro), useValue: retroRepo },
        { provide: getRepositoryToken(Participant), useValue: participantRepo },
        { provide: ParticipantGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<RetroItemsService>(RetroItemsService);
  });

  it('should create a retro item', async () => {
    const dto = { retro_id: '1', content: 'text', format_type: RetroFormatTypes.format_1, created_by: 'u1' };
    const savedItem = { id: 'i1', ...dto, creator: { name: 'User' }, is_edited: false };
    retroRepo.findOne.mockResolvedValue(true);
    retroItemRepo.create.mockReturnValue(dto);
    retroItemRepo.save.mockResolvedValue(savedItem);

    const result = await service.create(dto);
    expect(result.content).toBe('text');
    expect(gateway.broadcastItemAdded).toHaveBeenCalled();
  });

  it('should throw if retro not found on create', async () => {
    retroRepo.findOne.mockResolvedValue(null);
    await expect(service.create({ retro_id: '1' } as any)).rejects.toThrow(NotFoundException);
  });

  it('should find retro items by retroId', async () => {
    retroRepo.findOne.mockResolvedValue(true);
    retroItemRepo.find.mockResolvedValue([{ id: '1', retro_id: '1', format_type: 'sad', content: '...', creator: { name: 'A' }, created_by: 'u1', is_edited: false }]);
    const items = await service.findByRetroId('1');
    expect(items[0].category).toBe('sad');
  });

  it('should update a retro item by creator', async () => {
    const item = { id: '1', created_by: 'u1', creator: { name: 'A' }, content: '', format_type: '', is_edited: false };
    retroItemRepo.findOne.mockResolvedValue(item);
    participantRepo.findOne.mockResolvedValue({ userId: 'u1', role: false });
    retroItemRepo.save.mockResolvedValue({ ...item, content: 'updated', format_type: 'happy', is_edited: true });

    const result = await service.update('1', 'updated', 'happy', 'u1', 'r1');
    expect(result.content).toBe('updated');
    expect(gateway.broadcastItemUpdated).toHaveBeenCalled();
  });

  it('should prevent unauthorized user from updating item', async () => {
    retroItemRepo.findOne.mockResolvedValue({ created_by: 'other' });
    participantRepo.findOne.mockResolvedValue({ userId: 'u1', role: false });
    await expect(service.update('1', '', '', 'u1', 'r1')).rejects.toThrow(ForbiddenException);
  });

  it('should delete item as facilitator', async () => {
    const item = { id: '1', created_by: 'u1', creator: {} };
    retroItemRepo.findOne.mockResolvedValue(item);
    participantRepo.findOne.mockResolvedValue({ userId: 'u2', role: true });

    await service.remove('1', 'u2', 'r1');
    expect(retroItemRepo.remove).toHaveBeenCalledWith(item);
    expect(gateway.broadcastItemDeleted).toHaveBeenCalled();
  });

  it('should not allow delete by non-creator participant', async () => {
    retroItemRepo.findOne.mockResolvedValue({ created_by: 'u1', creator: {} });
    participantRepo.findOne.mockResolvedValue({ userId: 'u2', role: false });
    await expect(service.remove('1', 'u2', 'r1')).rejects.toThrow(ForbiddenException);
  });

  it('should count action items', async () => {
    retroItemRepo.count.mockResolvedValue(5);
    const result = await service.getActionItemsStats();
    expect(result.total).toBe(5);
  });
});
