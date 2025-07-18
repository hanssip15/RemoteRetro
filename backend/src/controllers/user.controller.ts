import { Controller, Get, Param,UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':email')
  async findOne(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
        return null;
    }
    return user;
  }
}