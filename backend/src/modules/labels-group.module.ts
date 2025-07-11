import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabelsGroupController } from '../controllers/labels-group.controller';
import { LabelsGroupService } from '../services/labels-group.service';
import { LabelsGroup } from '../entities/group.entity';
import { VotingController } from '../controllers/voting.controller';
import { VotingService } from '../services/voting.service';
import { ParticipantGateway } from '../gateways/participant.gateways';

@Module({
  imports: [TypeOrmModule.forFeature([LabelsGroup])],
  controllers: [LabelsGroupController, VotingController],
  providers: [LabelsGroupService, VotingService, ParticipantGateway],
  exports: [LabelsGroupService, VotingService],
})
export class LabelsGroupModule {} 