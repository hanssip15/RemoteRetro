import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from '../../src/controllers/group.controller';
import { GroupService } from '../../src/services/group.service';

describe('GroupController', () => {
  let controller: GroupController;
  let service: GroupService;

  const mockGroupService = {
    create: jest.fn(),
    findByRetroId: jest.fn(),
    updateLabel: jest.fn(),
    updateVotes: jest.fn(),
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // optional: supress console.error
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [{ provide: GroupService, useValue: mockGroupService }],
    }).compile();

    controller = module.get<GroupController>(GroupController);
    service = module.get<GroupService>(GroupService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createGroup', () => {
    it('should call groupService.create and return the result', async () => {
      const retroId = '123';
      const mockGroup = { id: 1, label: 'Group A', retroId };
      mockGroupService.create.mockResolvedValue(mockGroup);

      const result = await controller.createGroup(retroId);

      expect(mockGroupService.create).toHaveBeenCalledWith(retroId);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('getGroup', () => {
    it('should call groupService.findByRetroId and return the result', async () => {
      const retroId = '123';
      const mockGroups = [{ id: 1, label: 'Group A' }, { id: 2, label: 'Group B' }];
      mockGroupService.findByRetroId.mockResolvedValue(mockGroups);

      const result = await controller.getGroup(retroId);

      expect(mockGroupService.findByRetroId).toHaveBeenCalledWith(retroId);
      expect(result).toEqual(mockGroups);
    });
  });

  describe('updateLabel', () => {
    it('should call groupService.updateLabel and return the result', async () => {
      const groupId = '1';
      const dto = { label: 'New Label' };
      const updatedGroup = { id: 1, label: dto.label };
      mockGroupService.updateLabel.mockResolvedValue(updatedGroup);

      const result = await controller.updateLabel(groupId, dto);

      expect(mockGroupService.updateLabel).toHaveBeenCalledWith(+groupId, dto.label);
      expect(result).toEqual(updatedGroup);
    });
  });

  describe('updateVotes', () => {
    it('should call groupService.updateVotes and return the result', async () => {
      const groupId = '1';
      const dto = { votes: 5 };
      const updatedGroup = { id: 1, votes: dto.votes };
      mockGroupService.updateVotes.mockResolvedValue(updatedGroup);

      const result = await controller.updateVotes(groupId, dto);

      expect(mockGroupService.updateVotes).toHaveBeenCalledWith(+groupId, dto.votes);
      expect(result).toEqual(updatedGroup);
    });
  });
});
