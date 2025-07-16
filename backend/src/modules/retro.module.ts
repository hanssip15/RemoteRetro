import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroController } from '../controllers/retro.controller';
import { ParticipantController } from '../controllers/participant.controller';
import { RetroService } from '../services/retro.service';
import { ParticipantService } from '../services/participant.service';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { Retro } from '../entities/retro.entity';
import { RetroItem } from '../entities/retro-item.entity';
import { Participant } from '../entities/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Retro, RetroItem, Participant])],
  controllers: [RetroController, ParticipantController],
  providers: [
    RetroService,
    ParticipantService,
    ParticipantGateway
    // Gunakan forwardRef untuk gateway
    // {
    //   provide: ParticipantGateway,
    //   useClass: forwardRef(() => ParticipantGateway),
    // },
  ],
  exports: [RetroService, ParticipantService, ParticipantGateway],
})
export class RetroModule {} 