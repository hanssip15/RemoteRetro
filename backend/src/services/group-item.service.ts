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

  // async create(createGroupItemDto: CreateGroupItemDto): Promise<GroupEntity[]> {
  //   console.log('🔍 Received DTO:', JSON.stringify(createGroupItemDto, null, 2));
    
  //   const { group_id, groups } = createGroupItemDto;
    
  //   // Clear existin  g labels for this retro
  //   await this.groupRepository.delete({ group_id });
    
  //   // Create new labels for each group
  //   const labelsToCreate: Partial<GroupEntity>[] = [];
    
  //   groups.forEach((group: { group_id: string; item_ids: string[] }, groupIndex: number) => {
  //     console.log(`📦 Processing group ${groupIndex + 1}:`, group);
  //     group.item_ids.forEach((itemId: string) => {
  //       console.log(`  📝 Adding item ${itemId} to group ${groupIndex + 1}`);
  //       labelsToCreate.push({
  //         group_id,
  //         item_id: itemId,
  //         label: `Group ${groupIndex + 1}`,
  //       });
  //     });
  //   });
    
  //   console.log('💾 Labels to create:', JSON.stringify(labelsToCreate, null, 2));
  //   const createdLabels = await this.groupRepository.save(labelsToCreate);
  //   console.log('✅ Created labels:', JSON.stringify(createdLabels, null, 2));
  //   return createdLabels;
  // }

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