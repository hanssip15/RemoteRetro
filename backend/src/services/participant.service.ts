import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../entities/participant.entity';
import { Retro } from '../entities/retro.entity';
import { JoinRetroDto } from '../dto/join-retro.dto';
import { ParticipantGateway } from '../gateways/participant.gateways';


@Injectable()
export class ParticipantService {
  
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    @Inject(forwardRef(() => ParticipantGateway))
    private readonly participantGateway: ParticipantGateway,

  ) {}

  async findByRetroId(retroId: string): Promise<Participant[]> {
    return this.participantRepository.find({
      where: { retroId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async isFacilitator(retroId: string, userId: string): Promise<boolean> {
    const participant = await this.retroRepository.findOne({
      where: { id: retroId},
    });

    const isFacilitator = participant?.facilitator === userId;

    return isFacilitator
    
  }

  async join(retroId: string, joinRetroDto: JoinRetroDto): Promise<Participant> {
  const { userId, role } = joinRetroDto;
  // Check if retro exists
  const retro = await this.retroRepository.findOne({ where: { id: retroId } });
  if (!retro) {
    throw new NotFoundException('Retro not found');
  }

  // Check if retro is still available for joining
  if (retro.status === 'completed') {
    throw new BadRequestException('Retro is completed');
  }
  
  // Cek dulu
  const existingParticipant = await this.participantRepository.findOne({
    where: { retroId, userId },
  });

  if (existingParticipant) {
    return existingParticipant;
  }

  const participant = this.participantRepository.create({
    retroId,
    userId,
    role,
  });

  try {
    const savedParticipant = await this.participantRepository.save(participant);
    this.participantGateway.broadcastParticipantUpdate(retroId);
    return savedParticipant;
  } catch (error: any) {
    // Tangani error duplicate (unique constraint violation)
    if (error.code === '23505') { // Postgres duplicate key
      const again = await this.participantRepository.findOne({ where: { retroId, userId } });
      if (again) return again;
    }
    throw error;
  }
}


    async leave(retroId: string, userId: string): Promise<void> {
  // Check if retro exists
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
    participant.isActive = false;
    await this.participantRepository.save(participant);
    this.participantGateway.broadcastParticipantUpdate(retroId);
  }
}
async activated(retroId: string, userId: string): Promise<void> {
  const participant = await this.participantRepository.findOne({ where: { retroId, userId } });
  if (!participant) {
    throw new NotFoundException('Participant not found');
  }
  participant.isActive = true;
  await this.participantRepository.save(participant);
  this.participantGateway.broadcastParticipantUpdate(retroId);
}

  async countUniqueMembers(): Promise<number> {
    const result = await this.participantRepository
      .createQueryBuilder('participant')
      .leftJoin('participant.user', 'user')
      .select('COUNT(DISTINCT user.name)', 'count')
      .getRawOne();
    
    return parseInt(result.count) || 0;
  }

  async updateRole(retroId: string, participantId: string): Promise<Participant> {
    const retro = await this.retroRepository.findOne({ where: { id: retroId } });
    if (!retro) {
      throw new NotFoundException('Retro not found');
    }

    const participant = await this.participantRepository.findOne({ where: { id: parseInt(participantId)} });
    if (!participant || participant.retroId !== retroId) {
      throw new NotFoundException('Participant not found in this retro');
    }
    
    const oldfacilitator = await this.participantRepository.findOne({ where: { role: true, retroId: retroId } });
    if (oldfacilitator) {
      oldfacilitator.role = false;
      await this.participantRepository.save(oldfacilitator);
    }
    retro.facilitator = participant.userId;
    participant.role = true;
    await this.retroRepository.save(retro);
    await this.participantRepository.save(participant);
    this.participantGateway.broadcastParticipantUpdate(retroId);
    
    return participant;
  }
  async findParticipantByUserIdAndRetroId(userId: string, retroId: string): Promise<Participant | null> {
    return this.participantRepository.findOne({
      where: { userId, retroId },
    });
  }
} 