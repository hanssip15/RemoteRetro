// jwt.strategy.spec.ts
import { JwtStrategy } from '../../src/auth/jwt.strategy';
import { Request } from 'express';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    strategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('jwtFromRequest', () => {
    it('should return token if present in cookies', () => {
      const req = {
        cookies: { token: 'sample_token' },
      } as unknown as Request;

      const extractor = (strategy as any)._jwtFromRequest; // akses extractor dari super
      const token = extractor(req);

      expect(token).toBe('sample_token');
    });

    it('should return null if no cookies', () => {
      const req = {} as Request;

      const extractor = (strategy as any)._jwtFromRequest;
      const token = extractor(req);

      expect(token).toBeNull();
    });

    it('should return null if cookies exist but no token', () => {
      const req = { cookies: {} } as unknown as Request;

      const extractor = (strategy as any)._jwtFromRequest;
      const token = extractor(req);

      expect(token).toBeNull();
    });
  });

  describe('validate', () => {
    it('should return user object with payload data', async () => {
      const payload = {
        sub: '12345',
        email: 'test@example.com',
        name: 'John Doe',
        imageUrl: 'http://example.com/img.png',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '12345',
        sub: '12345',
        email: 'test@example.com',
        name: 'John Doe',
        imageUrl: 'http://example.com/img.png',
      });
    });

    it('should set imageUrl to null if not provided', async () => {
      const payload = {
        sub: '12345',
        email: 'test@example.com',
        name: 'John Doe',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '12345',
        sub: '12345',
        email: 'test@example.com',
        name: 'John Doe',
        imageUrl: null,
      });
    });
  });
});
