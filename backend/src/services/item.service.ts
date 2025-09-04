import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetroItem, RetroFormatTypes } from '../entities/retro-item.entity';
import { CreateRetroItemDto, UpdateItemDto } from '../dto/item.dto';
import { Retro } from '../entities/retro.entity';
import { Participant } from '../entities/participant.entity';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { GroupItem } from '../entities/group-item.entity';

@Injectable()
export class RetroItemsService {
  constructor(
    @InjectRepository(RetroItem)
    private retroItemRepository: Repository<RetroItem>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(GroupItem)
    private groupItemRepository: Repository<GroupItem>,
    private readonly participantGateway: ParticipantGateway,
  ) {}

  async create(retro_id:string,dto: CreateRetroItemDto): Promise<any> {
    // First check if the retro exists
    const retro = await this.retroRepository.findOne({ where: { id: retro_id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${retro_id} not found`);
    }

    const newItem = this.retroItemRepository.create({retro_id, ...dto});
    const savedItem = await this.retroItemRepository.save(newItem);
    
    // Transform to match frontend interface
    const transformedItem = {
      id: savedItem.id,
      retroId: savedItem.retro_id,
      category: savedItem.format_type,
      content: savedItem.content,
      author: savedItem.creator?.name,
      createdBy: savedItem.created_by,
      isEdited: savedItem.is_edited,
    };

    // Broadcast the new item to all connected clients
    this.participantGateway.broadcastItemAdded(retro_id, transformedItem);
    
    return transformedItem;
  }

  async insert(item_id:string, group_id:number): Promise<GroupItem> {
    const groupItem = this.groupItemRepository.create({item_id,group_id});
    return this.groupItemRepository.save(groupItem);
  }

  async findByRetroId(retroId: string): Promise<any[]> {
    // First check if the retro exists
    const retro = await this.retroRepository.findOne({ where: { id: retroId } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${retroId} not found`);
    }

    const items = await this.retroItemRepository.find({
      where: { retro_id: retroId },
      relations: ['creator'],
      order: { updated_at: 'ASC' },
    });

    // Transform to match frontend interface
    const transformedItems = items.map(item => ({
      id: item.id,
      retroId: item.retro_id,
      category: item.format_type,
      content: item.content,
      author: item.creator?.name || item.creator?.email,
      createdBy: item.created_by,
      isEdited: item.is_edited,
    }));

    return transformedItems;
  }

  async update(id: string, dto: UpdateItemDto): Promise<any> {
  const { content, format_type } = dto;

  const item = await this.retroItemRepository.findOne({
    where: { id },
    relations: ['creator'],
  });

  if (!item) {
    throw new NotFoundException('Item not found');
  }

  // Tentukan updated_at
  const updated_at = item.format_type !== format_type ? new Date() : item.updated_at;

  // Update item
  await this.retroItemRepository.update(id, {
    content,
    format_type,
    is_edited: true,
    updated_at,
  });

  const updatedItem = await this.retroItemRepository.findOne({
    where: { id },
    relations: ['creator'],
  });

  if (!updatedItem) {
    throw new NotFoundException('Item not found after update');
  }

  // Transform to match frontend interface
  const transformedItem = {
    id: updatedItem.id,
    category: updatedItem.format_type,
    content: updatedItem.content,
    author: updatedItem.creator?.name,
    createdBy: updatedItem.created_by,
    isEdited: updatedItem.is_edited,
    updatedAt: updatedItem.updated_at, // tambahkan kalau frontend butuh
  };

  // Broadcast the updated item
  this.participantGateway.broadcastItemUpdated(updatedItem.retro_id, transformedItem);

  return transformedItem;
}

  async remove(id: string): Promise<void> {
    const item = await this.retroItemRepository.findOne({ 
      where: { id },
      relations: ['creator']
    });
    
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const retro_id = item.retro_id;
    await this.retroItemRepository.remove(item);
    this.participantGateway.broadcastItemDeleted(retro_id, id);
  }

  async getActionItemsStats(): Promise<{ total: number }> {
    const total = await this.retroItemRepository.count({
      where: { format_type: RetroFormatTypes.format_3 } // Assuming format_3 is for action items
    });
    
    return { total };
  }


}