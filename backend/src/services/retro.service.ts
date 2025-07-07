import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retro } from '../entities/retro.entity';
import { RetroItem } from '../entities/retro-item.entity';
import { Participant } from '../entities/participant.entity';
import { CreateRetroDto } from '../dto/create-retro.dto';
import { UpdateRetroDto } from '../dto/update-retro.dto';

@Injectable()
export class RetroService {
  constructor(
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    @InjectRepository(RetroItem)
    private retroItemRepository: Repository<RetroItem>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  async findAll(): Promise<Retro[]> {
    return this.retroRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findWithPagination(limit: number, offset: number): Promise<[Retro[], number]> {
    return this.retroRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: string): Promise<{ retro: Retro; items: RetroItem[]; participants: Participant[] }> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }

    const items = await this.retroItemRepository.find({
      where: { retroId: id },
      order: { createdAt: 'ASC' },
    });

    const participants = await this.participantRepository.find({
      where: { retroId: id },
      order: { joinedAt: 'ASC' },
    });

    return { retro, items, participants };
  }

  async create(createRetroDto: CreateRetroDto): Promise<Retro> {
    const retro = this.retroRepository.create({
      id: crypto.randomUUID(), // Generate UUID for ID
      ...createRetroDto,
      status: 'active'
    });
    return this.retroRepository.save(retro);
  }

  async update(id: string, updateRetroDto: UpdateRetroDto): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }

    Object.assign(retro, updateRetroDto);
    return this.retroRepository.save(retro);
  }

  async remove(id: string): Promise<void> {
    const result = await this.retroRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }
  }

  async count(): Promise<number> {
    return this.retroRepository.count();
  }
} 