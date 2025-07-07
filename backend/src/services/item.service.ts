import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetroItem } from '../entities/retro-item.entity';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(RetroItem)
    private itemRepository: Repository<RetroItem>,
  ) {}

  async findByRetroId(retroId: string): Promise<RetroItem[]> {
    return this.itemRepository.find({
      where: { retroId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<RetroItem> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  // async create(retroId: number, createItemDto: CreateItemDto): Promise<RetroItem> {
  //   const item = this.itemRepository.create({
  //     ...createItemDto,
  //     retroId,
  //     votes: 0,
  //   });
  //   return this.itemRepository.save(item);
  // }

  async update(id: number, updateItemDto: UpdateItemDto): Promise<RetroItem> {
    const item = await this.findOne(id);
    Object.assign(item, updateItemDto);
    return this.itemRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    const result = await this.itemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
  }

  async vote(id: number): Promise<RetroItem> {
    const item = await this.findOne(id);
    item.votes += 1;
    return this.itemRepository.save(item);
  }

  async getActionItemsStats(): Promise<{ total: number }> {
    const total = await this.itemRepository.count({
      where: { type: 'action_item' },
    });
    
    return { total };
  }
} 