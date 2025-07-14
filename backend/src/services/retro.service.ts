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

  async findWithPagination(userId: string, limit: number, offset: number): Promise<[Retro[], number]> {
    return this.retroRepository.findAndCount({
      order: { createdAt: 'DESC' },
      where: { createdBy: userId },
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
    
    const retroData = {
      id: crypto.randomUUID(), // Generate UUID for ID
      ...createRetroDto,
      createdBy: userId,
      status: 'draft',
      format: createRetroDto.format || 'happy_sad_confused' // Default format
    };
    
    
    const retro = this.retroRepository.create(retroData);
    const savedRetro = await this.retroRepository.save(retro);
    
    return savedRetro;
  }

  async updateStatus(id: string, updateRetroDto: UpdateRetroDto): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }
    Object.assign(retro, updateRetroDto);


    this.participantGateway.broadcastRetroStarted(id);
    return this.retroRepository.save(retro);
  }

  async updatePhase(id: string, phase: string, facilitatorId: string): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }

    // Verify that the user is a facilitator
    const participant = await this.participantRepository.findOne({
      where: { retroId: id, userId: facilitatorId, role: true }
    });

    if (!participant) {
      throw new NotFoundException('Only facilitators can change phases');
    }

    retro.currentPhase = phase;

    // Broadcast phase change to all participants
    this.participantGateway.broadcastPhaseChange(id, phase);
    
    return this.retroRepository.save(retro);
  }

  async remove(id: string): Promise<void> {
    const result = await this.retroRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }
  }

  async count(userId: string): Promise<number> {
    return this.retroRepository.count({
      where: { createdBy: userId },
    });
  }

  async countByStatus(status: string, userId: string): Promise<number> {
    return this.retroRepository.count({
      where: { status, createdBy: userId },
    });
  }
} 