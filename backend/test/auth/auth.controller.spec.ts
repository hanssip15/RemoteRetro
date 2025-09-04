import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/controllers/auth.controller';
import { UsersService } from '../../src/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleCallback', () => {
    it('should create user if not exists, sign JWT and redirect', async () => {
      const req = {
        user: { name: 'John', email: 'john@example.com', imageUrl: 'img.jpg' },
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const createdUser = { id: '123', name: 'John', email: 'john@example.com', imageUrl: 'img.jpg' };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('signed-token');

      process.env.FRONTEND_URL = 'http://localhost:3000';

      await controller.googleCallback(req, res);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        imageUrl: 'img.jpg',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        imageUrl: createdUser.imageUrl,
      });
      expect(res.cookie).toHaveBeenCalledWith('token', 'signed-token', expect.any(Object));
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/auth/callback?token=signed-token`,
      );
    });

    it('should return 500 if user creation fails', async () => {
      const req = {
        user: { name: 'John', email: 'john@example.com', imageUrl: 'img.jpg' },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(null);

      await controller.googleCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create or retrieve user.' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return decoded JWT payload', async () => {
      const req = {
        user: { sub: '123', name: 'John', email: 'john@example.com', imageUrl: 'img.jpg' },
      } as unknown as Request;

      const result = await controller.getCurrentUser(req);
      expect(result).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        imageUrl: 'img.jpg',
      });
    });
  });

  describe('logout', () => {
    it('should clear token cookie and return message', () => {
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const result = controller.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});
