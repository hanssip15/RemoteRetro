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
import { PrismaService } from '../services/prisma.service';
import { Prisma, Retro } from '@prisma/client';
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
    private readonly prismaService: PrismaService,
  ) {}



  // Endpoint untuk group
  @Post('group/:retro_id')
  async createLabelGroup(@Param('retro_id') retro_id: string, @Body() data: { label: string; item_id: string }) {
    console.log('📦 Creating label group:', data);

    const group = await this.groupService.create({
      label: data.label,
      votes: 0,
      retro_id: retro_id,
    });

    console.log('✅ Created group:', group);
    return group;
    // Buat group item
    // const groupItem = await this.groupItemService.create({
    //   label: 'unlabeled',
    //   item_id: data.item_id,
    //   group_id: data.retro_id,
    // });
    
    // console.log('✅ Created group item:', groupItem);
    // return groupItem;
  }

  @Get('group/:retroId')
  async getLabelsByRetro(@Param('retroId') retroId: string) {
    console.log('📋 Getting labels for retro:', retroId);
    return this.groupService.findByRetroId(retroId);
  }

  @Put('group/:id')
  async updateLabel(@Param('id') id: string, @Body() data: { label: string }) {
    console.log('✏️ Updating label:', id, data);
    return this.groupService.updateLabel(+id, data.label);
  }
}
