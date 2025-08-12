import { Controller, Get, Post, Body, Param, Patch,} from '@nestjs/common';
import { GroupService } from '../services/group.service';
import { GroupItemService } from '../services/group-item.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/entities/group.entity';

@Controller('group')
export class GroupController {
  constructor(
    @InjectRepository(GroupEntity)
    private groupRepository: Repository<GroupEntity>,
    private readonly groupService: GroupService,
    private readonly groupItemService: GroupItemService,
  ) {}

  // Membuat grup baru pada suatu retro
  @Post('v1/retros/:retro_id/create')
  async createGroup(@Param('retro_id') retro_id: string, @Body() data: { label: string; item_id: string }) {
    const group = await this.groupService.create({
      label: data.label,
      votes: 0,
      retro_id: retro_id,});
    return group;

  }
  // Mendapatkan group dari suatu retro
  @Get('v1/retros/:retro_id')
  async getGroup(@Param('retro_id') retro_id: string) {
    return this.groupService.findByRetroId(retro_id);
  }
  // Mengubah label pada grup
  @Patch('v1/groups/:group_id/update-label')
  async updateLabel(@Param('group_id') group_id: string, @Body() data: { label: string }) {
    return this.groupService.updateLabel(+group_id, data.label);
  }
  // Mengubah vote 
  @Patch('v1/groups/:group_id/update-votes')
  async updateVotes(@Param('group_id') group_id: string, @Body() data: { votes: number }) {
    return this.groupService.updateVotes(+group_id, data.votes);
  }
}
