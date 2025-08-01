import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retro } from '../entities/retro.entity';
import { RetroItem } from '../entities/retro-item.entity';
import { Participant } from '../entities/participant.entity';
import { CreateRetroDto } from '../dto/create-retro.dto';
import { UpdateRetroDto } from '../dto/update-retro.dto';
import { ParticipantGateway } from '../gateways/participant.gateways';

@Injectable()
export class RetroService {
  eventEmitter: any;
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
    const qb = this.retroRepository
    .createQueryBuilder('retro')
    .innerJoin('retro.participants', 'participant')
    .leftJoinAndSelect('retro.creator', 'creator') // misal mau ambil data pembuat retro juga
    .where('participant.userId = :userId', { userId })
    .orderBy('retro.createdAt', 'DESC')
    .skip(offset)
    .take(limit);

  const [retros, count] = await qb.getManyAndCount();
  return [retros, count];
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

  async leave(retroId: string, userId: string): Promise<void> {
  // Check if retro exists
  const retro = await this.retroRepository.findOne({ where: { id: retroId } });
  if (!retro) {
    throw new NotFoundException('Retro not found');
  }

  // Find and remove participant
  const participant = await this.participantRepository.findOne({
    where: { 
      retroId: retroId, 
      userId: userId
     },
  });

  if (participant) {
    await this.participantRepository.remove(participant);
    
    // Emit WebSocket event to notify others
    this.participantGateway.broadcastParticipantUpdate(retroId);

  }
}

  async create(createRetroDto: CreateRetroDto): Promise<Retro> {
    
    const retroData = {
      id: crypto.randomUUID(), // Generate UUID for ID
      ...createRetroDto,
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

    // Broadcast based on status change
    if (updateRetroDto.status === 'completed') {
      this.participantGateway.broadcastRetroCompleted(id);
    } else if (updateRetroDto.status === 'ongoing') {
      this.participantGateway.broadcastRetroStarted(id);
    }
    
    return this.retroRepository.save(retro);
  }

  async updatePhase(id: string, phase: string): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }

    // Verify that the user is a facilitator

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
    return this.retroRepository
    .createQueryBuilder('retro')
    .innerJoin('retro.participants', 'participant')
    .where('participant.userId = :userId', { userId })
    .getCount();
  }

  async countByStatus(status: string, userId: string): Promise<number> {
    return this.retroRepository
    .createQueryBuilder('retro')
    .innerJoin('retro.participants', 'participant')
    .where('participant.userId = :userId', { userId })
    .andWhere('retro.status = :status', { status })
    .getCount();
  }

} 