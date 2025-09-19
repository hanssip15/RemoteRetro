import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../entities/participant.entity';
import { Retro } from '../entities/retro.entity';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { DataSource } from 'typeorm';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    @Inject(forwardRef(() => ParticipantGateway))
    private readonly participantGateway: ParticipantGateway,
    private readonly dataSource: DataSource
    
  ) {}

  async findByRetroId(retroId: string): Promise<Participant[]> {
    return this.participantRepository.find({
      where: { retroId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async isFacilitator(retroId: string, userId: string): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      where: { retroId, userId },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found in this retro');
    }
    return participant.role;
  }

  async join(retroId: string, userId:string): Promise<void | Participant> {
    try {
      const retro = await this.retroRepository.findOne({ where: { id: retroId } });
        if (!retro) {
          return;
        }
      const participant = this.participantRepository.create({ retroId, userId, role: false, isActive:true });
      const savedParticipant = await this.participantRepository.save(participant);
      return savedParticipant;

    } catch (error: any) {
      if (error.code === '23505') {
        const again = await this.participantRepository.findOne({ where: { retroId, userId } });
        if (again) return again;
      }
      throw error;
    } 
  }

    async deactivate(retroId: string, userId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { 
        retroId: retroId, 
        userId: userId
      },
    });

    if (participant) {
      participant.isActive = false;
      await this.participantRepository.save(participant);
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


async updateRoleFacilitator(retroId: string, participantId: number): Promise<Participant> {
  return await this.dataSource.transaction(async (manager) => {
    const retro = await manager.getRepository(Retro).findOne({ where: { id: retroId } });
    if (!retro) {
      throw new NotFoundException('Retro not found');
    }
    const participant = await manager.getRepository(Participant).findOne({
      where: { id: participantId },
    });
    if (!participant || participant.retroId !== retroId) {
      throw new NotFoundException('Participant not found in this retro');
    }
    const oldfacilitator = await manager.getRepository(Participant).findOne({
      where: { role: true, retroId: retroId },
    });

    if (oldfacilitator) {
      oldfacilitator.role = false;
      await manager.getRepository(Participant).save(oldfacilitator);
    }

    participant.role = true;
    const updatedParticipant = await manager.getRepository(Participant).save(participant);
    return updatedParticipant;
  }).then((updatedParticipant) => {
    this.participantGateway.broadcastParticipantUpdate(retroId);
    return updatedParticipant;
  });
}

async findParticipantByID(id: number): Promise<Participant | null> {
    return this.participantRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }


  async findParticipantByUserIdAndRetroId(userId: string, retroId: string): Promise<Participant | null> {
    return this.participantRepository.findOne({
      where: { userId, retroId },
    });
  }
} 