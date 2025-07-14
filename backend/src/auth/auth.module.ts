// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';         
import { UsersModule } from '../modules/user.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_fallback_secret_key_here',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {
  constructor() {
    console.log('AuthModule - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.log('AuthModule - JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
  }
}
