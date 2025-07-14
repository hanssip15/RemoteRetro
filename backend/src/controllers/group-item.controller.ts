import { Controller, Post, Get, Put, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { GroupItemService } from '../services/group-item.service';
import { CreateGroupItemDto } from '../dto/create-group-item.dto';

@Controller('group-item')
export class GroupItemController {
  constructor(private readonly groupItemService: GroupItemService) {}

  @Post(':groupId/:itemId')
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('groupId') groupId: string, @Param('itemId') itemId: string) {
    return this.groupItemService.create({
      group_id: parseInt(groupId),
      item_id: itemId,
    });
  }

  @Get(':groupId')    
  async findByGroupId(@Param('groupId') groupId: string) {
    return this.groupItemService.findByGroupId(groupId);
  }

  @Put(':id')
  async updateLabel(@Param('id') id: string, @Body() updateData: { label: string }) {
    return this.groupItemService.updateLabel(parseInt(id), updateData.label);
  }
} 