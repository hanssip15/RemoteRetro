import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetroItem, RetroFormatTypes } from '../entities/retro-item.entity';
import { CreateRetroItemDto } from '../dto/create-item.dto';
import { Retro } from '../entities/retro.entity';
import { Participant } from '../entities/participant.entity';
import { ParticipantGateway } from '../gateways/participant.gateways';

@Injectable()
export class RetroItemsService {
  constructor(
    @InjectRepository(RetroItem)
    private retroItemRepository: Repository<RetroItem>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    private readonly participantGateway: ParticipantGateway,
  ) {}

  async create(dto: CreateRetroItemDto): Promise<any> {
    // First check if the retro exists
    const retro = await this.retroRepository.findOne({ where: { id: dto.retro_id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${dto.retro_id} not found`);
    }

    const newItem = this.retroItemRepository.create(dto);
    const savedItem = await this.retroItemRepository.save(newItem);
    
    // Transform to match frontend interface
    const transformedItem = {
      id: savedItem.id,
      retroId: savedItem.retro_id,
      category: savedItem.format_type,
      content: savedItem.content,
      author: savedItem.creator?.name || savedItem.creator?.email,
      createdBy: savedItem.created_by,
      isEdited: savedItem.is_edited,
    };

    // Broadcast the new item to all connected clients
    this.participantGateway.broadcastItemAdded(dto.retro_id, transformedItem);
    
    return transformedItem;
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
      order: { id: 'ASC' },
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

  async update(id: string, content: string, category: string, userId: string, retroId: string): Promise<any> {
    const item = await this.retroItemRepository.findOne({ 
      where: { id },
      relations: ['creator']
    });
    
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check if user is participant in this retro
    const participant = await this.participantRepository.findOne({
      where: { retroId, userId }
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this retro');
    }

    // Check permissions: facilitator can edit any item, regular user can only edit their own
    if (!participant.role && item.created_by !== userId) {
      throw new ForbiddenException('You can only edit your own items');
    }

    // Update the item
    item.content = content;
    item.format_type = category as any;
    item.is_edited = true;
    const updatedItem = await this.retroItemRepository.save(item);

    // Transform to match frontend interface
    const transformedItem = {
      id: updatedItem.id,
      retroId: updatedItem.retro_id,
      category: updatedItem.format_type,
      content: updatedItem.content,
      author: updatedItem.creator?.name || updatedItem.creator?.email,
      createdBy: updatedItem.created_by,
      isEdited: updatedItem.is_edited,
    };

    // Broadcast the updated item
    this.participantGateway.broadcastItemUpdated(retroId, transformedItem);

    return transformedItem;
  }

  async remove(id: string, userId: string, retroId: string): Promise<void> {
    const item = await this.retroItemRepository.findOne({ 
      where: { id },
      relations: ['creator']
    });
    
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check if user is participant in this retro
    const participant = await this.participantRepository.findOne({
      where: { retroId, userId }
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this retro');
    }

    // Check permissions: facilitator can delete any item, regular user can only delete their own
    if (!participant.role && item.created_by !== userId) {
      throw new ForbiddenException('You can only delete your own items');
    }

    await this.retroItemRepository.remove(item);
    
    // Broadcast item deletion
    this.participantGateway.broadcastItemDeleted(retroId, id);
  }

  async getActionItemsStats(): Promise<{ total: number }> {
    const total = await this.retroItemRepository.count({
      where: { format_type: RetroFormatTypes.format_3 } // Assuming format_3 is for action items
    });
    
    return { total };
  }


}