import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'your_fallback_secret_key_here';

    super({
      jwtFromRequest: (req: Request) => {
        let token = null;
        if (req && req.cookies){
          token = req.cookies?.token || null;
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      imageUrl: payload.imageUrl || null,
    };
  }
}
