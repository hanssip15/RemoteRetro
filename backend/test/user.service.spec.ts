import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/services/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn() as jest.MockedFunction<Repository<User>['findOne']>,
      create: jest.fn() as jest.MockedFunction<Repository<User>['create']>,
      save: jest.fn() as jest.MockedFunction<Repository<User>['save']>,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      const mockUser = { id: '1', email: 'id@example.com' } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const userDto = { email: 'create@example.com' } as Partial<User>;
      const mockCreatedUser = { ...userDto, id: '123' } as User;

      (userRepository.create as jest.Mock).mockReturnValue(mockCreatedUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await service.create(userDto);

      expect(userRepository.create).toHaveBeenCalledWith(userDto);
      expect(userRepository.save).toHaveBeenCalledWith(mockCreatedUser);
      expect(result).toEqual(mockCreatedUser);
    });
  });
});
