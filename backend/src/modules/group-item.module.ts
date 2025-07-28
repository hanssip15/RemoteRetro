import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroItem } from '../entities/retro-item.entity';
import { Retro } from '../entities/retro.entity';
import { Participant } from '../entities/participant.entity';
import { GroupItemService } from '../services/group-item.service';
import { GroupItemController } from '../controllers/group-item.controller';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { GroupItemEntity } from '../entities/group-item.entity';
import { RetroModule } from './retro.module'; // ✅ import RetroModule

@Module({
  imports: [
    TypeOrmModule.forFeature([RetroItem, Retro, Participant, GroupItemEntity]),
    forwardRef(() => RetroModule), // ✅ tambahkan ini
  ],
  controllers: [GroupItemController],
  providers: [GroupItemService, ParticipantGateway],
})
export class GroupItemModule {}
