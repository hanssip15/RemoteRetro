import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Retro } from '../entities/retro.entity';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { PrismaService } from '../services/prisma.service'; 
import { Action } from '../entities/action.entity';
import { ActionService } from '../services/action.service';
import { ActionController } from '../controllers/action.controller';
import { ParticipantService } from 'src/services/participant.service';
@Module({
  imports: [TypeOrmModule.forFeature([Retro, Action]), forwardRef(() => require('./retro.module').RetroModule)],
  controllers: [ActionController],
  providers: [ActionService, ParticipantGateway, PrismaService],
})
export class ActionModule {}