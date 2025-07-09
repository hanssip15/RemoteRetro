import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retro } from '../entities/retro.entity';
import { RetroItem } from '../entities/retro-item.entity';
import { Participant } from '../entities/participant.entity';
import { CreateRetroDto } from '../dto/create-retro.dto';
import { UpdateRetroDto } from '../dto/update-retro.dto';
import { ParticipantGateway } from 'src/gateways/participant.gateways';

@Injectable()
export class RetroService {
  constructor(
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    @InjectRepository(RetroItem)
    private retroItemRepository: Repository<RetroItem>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    private readonly participantGateway: ParticipantGateway,
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

  async findOne(id: string): Promise<{ retro: Retro; participants: Participant[] }> {
    const retro = await this.retroRepository.findOne({ where: { id } });

    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }

    const participants = await this.participantRepository.find({
      where: { retroId: id },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });

    return { retro, participants };
  }

  async create(createRetroDto: CreateRetroDto, userId?: string): Promise<Retro> {
    console.log('🏗️ === RETRO SERVICE DEBUG ===');
    console.log('📝 CreateRetroDto:', JSON.stringify(createRetroDto, null, 2));
    console.log('🆔 User ID:', userId);
    
    const retroData = {
      id: crypto.randomUUID(), // Generate UUID for ID
      ...createRetroDto,
      createdBy: userId,
      status: 'draft',
      format: createRetroDto.format || 'happy_sad_confused' // Default format
    };
    
    console.log('📦 Retro data to save:', JSON.stringify(retroData, null, 2));
    
    const retro = this.retroRepository.create(retroData);
    const savedRetro = await this.retroRepository.save(retro);
    
    console.log('✅ Retro created successfully:', JSON.stringify(savedRetro, null, 2));
    return savedRetro;
  }

  async updateStatus(id: string, updateRetroDto: UpdateRetroDto): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }
    Object.assign(retro, updateRetroDto);

    console.log('🔁 Retro status updated:', JSON.stringify(retro, null, 2));

    this.participantGateway.broadcastRetroStarted(id);
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