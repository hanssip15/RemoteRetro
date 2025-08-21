import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retro } from '../entities/retro.entity';
import { RetroItem } from '../entities/retro-item.entity';
import { Participant } from '../entities/participant.entity';
import { CreateRetroDto} from '../dto/retro.dto';
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
  const retro = await this.retroRepository.findOne({ where: { id: retroId } });
  if (!retro) {
    throw new NotFoundException('Retro not found');
  }
  const participant = await this.participantRepository.findOne({
    where: { 
      retroId: retroId, 
      userId: userId
     },
  });
  if (participant) {
    await this.participantRepository.remove(participant);    
    this.participantGateway.broadcastParticipantUpdate(retroId);
  }
}
  async create(createRetroDto: CreateRetroDto): Promise<Retro> {
    
    const retroData = {
      id: crypto.randomUUID(), // Generate UUID for ID
      ...createRetroDto,
      status: 'draft',
      currentPhase: 'lobby',
      format: createRetroDto.format || 'happy_sad_confused' // Default format
    };
    const retro = this.retroRepository.create(retroData);
    const savedRetro = await this.retroRepository.save(retro);
    return savedRetro;
  }

  async updateRetroStatus(id: string, status: string): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }
    if (status == '' || status == null){
      throw new NotFoundException(`Status not found`);
    }
    retro.status = status;
    if (status === 'completed') {
      this.participantGateway.broadcastRetroCompleted(id);
    } else if (status === 'ongoing') {
      this.participantGateway.broadcastRetroStarted(id);
    }
    
    return this.retroRepository.save(retro);
  }

  async updateRetroPhase(id: string, phase: string): Promise<Retro> {
    const retro = await this.retroRepository.findOne({ where: { id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${id} not found`);
    }
    retro.currentPhase = phase;
    this.participantGateway.broadcastPhaseChange(id, phase);
    
    return this.retroRepository.save(retro);
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