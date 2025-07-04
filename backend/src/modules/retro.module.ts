import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroController } from '../controllers/retro.controller';
import { ItemController } from '../controllers/item.controller';
import { ParticipantController } from '../controllers/participant.controller';
import { RetroService } from '../services/retro.service';
import { ItemService } from '../services/item.service';
import { ParticipantService } from '../services/participant.service';
import { Retro } from '../entities/retro.entity';
import { RetroItem } from '../entities/retro-item.entity';
import { Participant } from '../entities/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Retro, RetroItem, Participant])],
  controllers: [RetroController, ItemController, ParticipantController],
  providers: [RetroService, ItemService, ParticipantService],
  exports: [RetroService, ItemService, ParticipantService],
})
export class RetroModule {} 