import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'your_fallback_secret_key_here';
    console.log('=== JWT STRATEGY DEBUG ===');
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
    console.log('Using secret:', secret.substring(0, 10) + '...');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('=== JWT VALIDATION DEBUG ===');
    console.log('JWT payload received:', payload);
    console.log('User ID from payload:', payload.sub);
    return { 
      userId: payload.sub, 
      sub: payload.sub,
      email: payload.email,
      name: payload.name 
    };
  }
}
