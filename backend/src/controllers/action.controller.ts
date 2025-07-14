import { Controller, Post, Body, Get } from '@nestjs/common';
import { ActionService } from '../services/action.service';
import { CreateActionDto } from '../dto/create-action.dto';

@Controller('action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post()
  async create(@Body() dto: CreateActionDto) {
    return this.actionService.create(dto);
  }

  @Post('bulk')
  async bulkCreate(@Body() dtos: CreateActionDto[]) {
    return this.actionService.bulkCreate(dtos);
  }

  @Get()
  async findAll() {
    return this.actionService.findAll();
  }
}
