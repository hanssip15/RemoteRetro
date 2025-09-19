import { Controller, Post, Body, Get, Param, Patch,Delete } from '@nestjs/common';
import { ActionService } from '../services/action.service';
import { CreateActionDto,UpdateActionDto } from '../dto/create-action.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags("Action")
@Controller('action-item')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}
  @Post('v1/retros/:retro_id/create')
  @ApiOperation({ summary: 'Create action items' })
  @ApiBody({ type: CreateActionDto })
  async create(@Param('retro_id') retro_id: string, @Body() dtos: CreateActionDto) {
    return this.actionService.create(retro_id, dtos);
  }

  @Patch('v1/action-items/:item_id/edit')
  @ApiOperation({ summary: 'Edit action items' })
  async edit(@Param('retro_id') retro_id: string, @Param('item_id') item_id: number, @Body() dtos: UpdateActionDto) {
    return this.actionService.edit(item_id,dtos);
  }

  @Delete('v1/action-items/:item_id/delete')
  @ApiOperation({ summary: 'Delete action items' })
  async delete(@Param('item_id') item_id:number) {
    return this.actionService.delete(item_id);
  }

  @Get('v1/retros/:retro_id')
  @ApiOperation({ summary: 'Get all action items by retro ID' })
  async getActionsByRetro(@Param('retro_id') retro_id: string) {
    return this.actionService.findByRetroId(retro_id);
  }
}
