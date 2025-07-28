// participant-gateway.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ParticipantGateway } from '../gateways/participant.gateways';
import { RetroModule } from './retro.module'; // pastikan path benar

@Module({
  imports: [forwardRef(() => RetroModule)],
  providers: [ParticipantGateway],
  exports: [ParticipantGateway],
})
export class ParticipantGatewayModule {}
