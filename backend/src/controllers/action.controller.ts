import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ActionService } from '../services/action.service';
import { CreateActionDto } from '../dto/create-action.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('action-item')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}
  @Post('v1/retros/:retro_id/create-bulk')
  @ApiOperation({ summary: 'Create multiple action items' })
  @ApiBody({ type: [CreateActionDto] })
  async bulkCreate(@Param('retro_id') retro_id: string, @Body() dtos: CreateActionDto[]) {
    return this.actionService.bulkCreate(retro_id, dtos);
  }
  @Get('v1/retros/:retro_id')
  @ApiOperation({ summary: 'Get all action items by retro ID' })
  async getActionsByRetro(@Param('retro_id') retro_id: string) {
    return this.actionService.findByRetroId(retro_id);
  }
}
