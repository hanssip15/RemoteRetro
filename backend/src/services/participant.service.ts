import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../entities/participant.entity';
import { Retro } from '../entities/retro.entity';
import { JoinRetroDto } from '../dto/join-retro.dto';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
  ) {}

  async findByRetroId(retroId: string): Promise<Participant[]> {
    return this.participantRepository.find({
      where: { retroId },
      order: { joinedAt: 'ASC' },
    });
  }

  // async join(retroId: string, joinRetroDto: JoinRetroDto): Promise<Participant> {
  //   // Check if retro exists
  //   const retro = await this.retroRepository.findOne({ where: { id: retroId } });
  //   if (!retro) {
  //     throw new NotFoundException('Retro not found');
  //   }

  //   // Check if retro is still available for joining
  //   if (retro.status !== 'active' && retro.status !== 'draft') {
  //     throw new BadRequestException('Retro is not available for joining');
  //   }

  //   // const existingParticipant = await this.participantRepository.findOne({
  //   //   where: { retroId, name: joinRetroDto.name.trim() },
  //   // });

  //   // if (existingParticipant) {
  //   //   throw new ConflictException('Name already taken in this retro');
  //   // }

  //   const participant = this.participantRepository.create({
  //     retroId,
  //     name: joinRetroDto.name.trim(),
  //     role: 'participant',
  //   });

  //   return this.participantRepository.save(participant);
  // }

  async remove(id: string): Promise<void> {
    const result = await this.participantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
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
} 