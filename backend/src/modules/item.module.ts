import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroItem } from '../entities/retro-item.entity';
import { Retro } from '../entities/retro.entity';
import { Participant } from '../entities/participant.entity';
import { RetroItemsService } from '../services/item.service';
import { RetroItemsController } from '../controllers/item.controller';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { ParticipantService } from 'src/services/participant.service';

@Module({
  imports: [TypeOrmModule.forFeature([RetroItem, Retro, Participant]), forwardRef(() => require('./retro.module').RetroModule)],
  controllers: [RetroItemsController],
  providers: [RetroItemsService, ParticipantGateway],
})
export class RetroItemsModule {}