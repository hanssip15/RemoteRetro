import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from '../services/user.service';

@Controller('user/v1/users/')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  // Mendapatkan data user berdasarkan email
  // @Get(':user_id')
  // async findOne(@Param('user_id') user_id: string) {
  //   const user = await this.usersService.findById(user_id);
  //   if (!user) {
  //     throw new NotFoundException(`User with userId "${user_id}" not found`);
  //   }
  //   return user;
  // }
} 