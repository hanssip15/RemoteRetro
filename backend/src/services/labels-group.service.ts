import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabelsGroup } from '../entities/group.entity';
import { CreateLabelsGroupDto } from '../dto/create-labels-group.dto';

@Injectable()
export class LabelsGroupService {
  constructor(
    @InjectRepository(LabelsGroup)
    private labelsGroupRepository: Repository<LabelsGroup>,
  ) {}

  async create(createLabelsGroupDto: CreateLabelsGroupDto): Promise<LabelsGroup[]> {
    console.log('🔍 Received DTO:', JSON.stringify(createLabelsGroupDto, null, 2));
    
    const { retro_id, groups } = createLabelsGroupDto;
    
    // Clear existing labels for this retro
    await this.labelsGroupRepository.delete({ retro_id });
    
    // Create new labels for each group
    const labelsToCreate: Partial<LabelsGroup>[] = [];
    
    groups.forEach((group: { groupId: string; itemIds: string[] }, groupIndex: number) => {
      console.log(`📦 Processing group ${groupIndex + 1}:`, group);
      group.itemIds.forEach((itemId: string) => {
        console.log(`  📝 Adding item ${itemId} to group ${groupIndex + 1}`);
        labelsToCreate.push({
          retro_id,
          item_id: itemId,
          label: `Group ${groupIndex + 1}`,
          votes: 0
        });
      });
    });
    
    console.log('💾 Labels to create:', JSON.stringify(labelsToCreate, null, 2));
    const createdLabels = await this.labelsGroupRepository.save(labelsToCreate);
    console.log('✅ Created labels:', JSON.stringify(createdLabels, null, 2));
    return createdLabels;
  }

  async findByRetroId(retroId: string): Promise<LabelsGroup[]> {
    return this.labelsGroupRepository.find({
      where: { retro_id: retroId },
      relations: ['item'],
      order: { id: 'ASC' }
    });
  }

  async updateLabel(id: number, label: string): Promise<LabelsGroup> {
    await this.labelsGroupRepository.update(id, { label });
    const result = await this.labelsGroupRepository.findOne({ where: { id } });
    if (!result) {
      throw new Error(`LabelsGroup with id ${id} not found`);
    }
    return result;
  }
} 