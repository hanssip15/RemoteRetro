import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupItemEntity } from '../entities/group-item.entity';
import { CreateGroupItemDto } from '../dto/create-group-item.dto';

@Injectable()
export class GroupItemService {
  constructor(
    @InjectRepository(GroupItemEntity)
    private groupItemRepository: Repository<GroupItemEntity>,
  ) {}

  // Method untuk membuat group item baru
  async create(createGroupItemDto: CreateGroupItemDto): Promise<GroupItemEntity> {
    const groupItem = this.groupItemRepository.create(createGroupItemDto);
    return this.groupItemRepository.save(groupItem);
  }


  async findByGroupId(groupId: string): Promise<GroupItemEntity[]> {
    return this.groupItemRepository.find({
      where: { group_id: parseInt(groupId) },
      relations: ['item'],
      order: { id: 'ASC' }
    });
  }

  async updateLabel(id: number, label: string): Promise<GroupItemEntity> {
    await this.groupItemRepository.update(id, { label });
    const result = await this.groupItemRepository.findOne({ where: { id } });
    if (!result) {
      throw new Error(`LabelsGroup with id ${id} not found`);
    }
    return result;
  }
} 