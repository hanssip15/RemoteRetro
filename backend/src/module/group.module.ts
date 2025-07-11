import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroItem } from '../entities/retro-item.entity';
import { Retro } from '../entities/retro.entity';
import { Participant } from '../entities/participant.entity';
import { LabelsGroupService } from '../services/group.service';
import { LabelsGroupController } from '../controllers/group.controller';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { LabelsGroup } from '../entities/group.entity';
import { PrismaService } from '../services/prisma.service'; 
@Module({
  imports: [TypeOrmModule.forFeature([RetroItem, Retro, Participant, LabelsGroup])],
  controllers: [LabelsGroupController],
  providers: [LabelsGroupService, ParticipantGateway, PrismaService],
})
export class GroupModule {}