import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../entities/participant.entity';
import { Retro } from '../entities/retro.entity';
import { JoinRetroDto } from '../dto/join-retro.dto';
import { ParticipantGateway } from 'src/gateways/participant.gateways';

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
    
    const existingParticipant = await this.participantRepository.findOne({
      where: { retroId, userId: userId },
    });

    if (existingParticipant) {
      throw new ConflictException('User already joined this retro');
    }

    const participant = this.participantRepository.create({
      retroId,
      userId: userId,
      role: role,
    });

    const savedParticipant = await this.participantRepository.save(participant);
    
    this.participantGateway.broadcastParticipantUpdate(retroId);

    return savedParticipant;
  }

  async remove(id: string, retroId: string): Promise<void> {
    
    const result = await this.participantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }
    this.participantGateway.broadcastParticipantUpdate(retroId);

  }

  async removeByRetroAndUser(retroId: string, userId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({ where: { retroId, userId } });
    if (participant) {
      await this.participantRepository.delete(participant.id);
    }
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
    participant.role = true;
    await this.participantRepository.save(participant);
    this.participantGateway.broadcastParticipantUpdate(retroId);
    
    return participant;
  }
} 