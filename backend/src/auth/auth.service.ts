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
    console.log('=== Generating JWT token ===');
    console.log('JWT_SECRET:', process.env.JWT_SECRET); 
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
    console.log('User for JWT:', user);
    
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    console.log('JWT payload:', payload);
    
    const token = this.jwtService.sign(payload);
    console.log('Generated JWT token:', token.substring(0, 50) + '...');
    console.log('JWT token length:', token.length);
    return token;
  }
}
