// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/services/auth.service';
import { UsersService } from '../src/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../src/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('validateGoogleUser', () => {
    it('should return user if found', async () => {
      usersService.findByEmail.mockResolvedValueOnce(mockUser);

      const result = await authService.validateGoogleUser(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(authService.validateGoogleUser('notfound@example.com'))
        .rejects
        .toThrow(UnauthorizedException);

      expect(usersService.findByEmail).toHaveBeenCalledWith('notfound@example.com');
    });
  });

  describe('generateJwt', () => {
    it('should return a signed JWT', () => {
      const fakeToken = 'signed-jwt-token';
      jwtService.sign.mockReturnValueOnce(fakeToken);

      const result = authService.generateJwt(mockUser);

      expect(result).toBe(fakeToken);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });
  });
});
