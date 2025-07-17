import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Retro } from '../entities/retro.entity';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { Action } from '../entities/action.entity';
import { ActionService } from '../services/action.service';
import { ActionController } from '../controllers/action.controller';
@Module({
  imports: [TypeOrmModule.forFeature([ Retro, Action])],
  controllers: [ActionController],
  providers: [ActionService, ParticipantGateway],
})
export class ActionModule {}