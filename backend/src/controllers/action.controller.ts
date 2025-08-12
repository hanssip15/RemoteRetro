import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ActionService } from '../services/action.service';
import { CreateActionDto } from '../dto/create-action.dto';

@Controller('action-item')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}
  @Post('v1/action-items/create-bulk')
  async bulkCreate(@Body() dtos: CreateActionDto[]) {
    return this.actionService.bulkCreate(dtos);
  }
  @Get('v1/retros/:retro_id')
  async getActionsByRetro(@Param('retro_id') retroId: string) {
    return this.actionService.findByRetroId(retroId);
  }
}
