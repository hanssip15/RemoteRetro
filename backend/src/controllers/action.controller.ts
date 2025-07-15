import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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
  @Get(':retro_id')
  async getActionsByRetro(@Param('retroId') retroId: string) {
    return this.actionService.findByRetroId(retroId);
  }
}
