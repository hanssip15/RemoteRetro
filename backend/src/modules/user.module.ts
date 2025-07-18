// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity'; // Adjust the import path as necessary
import { UsersService } from '../services/user.service'; // Adjust the import path as necessary
import { UserController } from 'src/controllers/user.controller';
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService], // 👈 Needed so AuthModule can use it
})
export class UsersModule {}
