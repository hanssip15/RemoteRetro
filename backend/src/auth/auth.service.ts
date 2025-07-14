// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/user.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(email: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found in the database.');
    }
    return user;
  }

  generateJwt(user: User): string {

    
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
      
    const token = this.jwtService.sign(payload);

    return token;
  }
}
