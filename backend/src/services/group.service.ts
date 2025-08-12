// src/group/group.service.ts

import { Injectable } from '@nestjs/common';
import { GroupEntity } from '../entities/group.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupDto } from '../dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private groupRepository: Repository<GroupEntity>,
  ) 
  {}

  async create(createGroupDto: CreateGroupDto ) {
    const group = this.groupRepository.create(createGroupDto);
    return this.groupRepository.save(group);
  }

  // Method untuk update label group
  async updateLabel(id: number, label: string) {
    await this.groupRepository.update(id, { label });
    return this.groupRepository.findOne({
      where: { id },
      relations: ['group_items', 'group_items.item'],
    });
  }

  // Method untuk update votes group
  async updateVotes(id: number, votes: number) {
    await this.groupRepository.update(id, { votes });
    return this.groupRepository.findOne({
      where: { id },
      relations: ['group_items', 'group_items.item'],
    });
  }

  // Method untuk mencari semua group berdasarkan retro_id
  async findByRetroId(retroId: string) {
    return this.groupRepository.find({
      where: {
        retro_id: retroId,
      },
      relations: ['group_items', 'group_items.item'],
    });
  }
}
