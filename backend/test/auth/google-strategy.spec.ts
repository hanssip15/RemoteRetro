// test/auth/google.strategy.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { GoogleStrategy } from '../../src/auth/google.strategy';
import { VerifyCallback } from 'passport-google-oauth20';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.BASE_URL = 'http://localhost:3000';

    strategy = new GoogleStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user info if email exists', async () => {
      const mockProfile = {
        id: '123',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
        photos: [{ value: 'http://example.com/photo.jpg' }],
      };

      const done: VerifyCallback = jest.fn();

      await strategy.validate('accessToken', 'refreshToken', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        imageUrl: 'http://example.com/photo.jpg',
      });
    });



    it('should throw UnauthorizedException if email is missing', async () => {
      const mockProfile = {
        id: '789',
        displayName: 'No Email User',
        emails: [],
        photos: [],
      };

      const done: VerifyCallback = jest.fn();
      await strategy.validate('accessToken', 'refreshToken', mockProfile, done);
      expect(done).toHaveBeenCalledWith(
        expect.any(UnauthorizedException),
        false,
      );
    });
  });
});
