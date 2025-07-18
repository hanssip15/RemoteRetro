// src/group/group.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { GroupService } from '../services/group.service';
import { GroupItemService } from '../services/group-item.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/entities/group.entity';

@Controller()
export class GroupController {
  constructor(
    @InjectRepository(GroupEntity)
    private groupRepository: Repository<GroupEntity>,
    private readonly groupService: GroupService,
    private readonly groupItemService: GroupItemService,
  ) {}



  // Endpoint untuk group
  @Post('group/:retro_id')
  async createLabelGroup(@Param('retro_id') retro_id: string, @Body() data: { label: string; item_id: string }) {

    const group = await this.groupService.create({
      label: data.label,
      votes: 0,
      retro_id: retro_id,
    });

    return group;

  }

  @Get('group/:retroId')
  async getLabelsByRetro(@Param('retroId') retroId: string) {
    return this.groupService.findByRetroId(retroId);
  }

  @Put('group/:id')
  async updateLabel(@Param('id') id: string, @Body() data: { label: string }) {

    return this.groupService.updateLabel(+id, data.label);
  }

  @Put('group/:id/votes')
  async updateVotes(@Param('id') id: string, @Body() data: { votes: number }) {
    return this.groupService.updateVotes(+id, data.votes);
  }
}
