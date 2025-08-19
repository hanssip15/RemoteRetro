import { Controller, Get, Post, Body, Param, Patch,} from '@nestjs/common';
import { GroupService } from '../services/group.service';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { GroupEntity } from 'src/entities/group.entity';
import { ApiBody, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

class UpdateLabel {
  @ApiProperty({ example:"label",description: 'Update group label' })
  @IsNotEmpty()
  @IsString()
  label: string;
}


class UpdateVotes {
  @ApiProperty({ example: 5, description: 'Update group votes' })
  @IsNotEmpty()
  @IsNumber()
  votes: number;
}

@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
  ) {}

  

  // Membuat grup baru pada suatu retro
  @Post('v1/retros/:retro_id/create')
  @ApiOperation({ summary: 'Create group for retro' })
  async createGroup(@Param('retro_id') retro_id: string) {
    const group = await this.groupService.create(retro_id);
    return group;
  }

  // Mendapatkan group dari suatu retro
  @Get('v1/retros/:retro_id')
  @ApiOperation({summary: "Get all group from retro"})
  async getGroup(@Param('retro_id') retro_id: string) {
    return this.groupService.findByRetroId(retro_id);
  }
  // Mengubah label pada grup
  @Patch('v1/groups/:group_id/update-label')
  @ApiOperation({ summary: 'Update group label' })
  @ApiBody({type: UpdateLabel})
  async updateLabel(@Param('group_id') group_id: string, @Body() dto: UpdateLabel) {
    return this.groupService.updateLabel(+group_id, dto.label);
  }
  // Mengubah vote 
  @Patch('v1/groups/:group_id/update-votes')
  @ApiOperation({ summary: 'Update group votes' })
  @ApiBody({type: UpdateVotes})
  async updateVotes(@Param('group_id') group_id: string, @Body() dto: UpdateVotes) {
    return this.groupService.updateVotes(+group_id, dto.votes);
  }
}
