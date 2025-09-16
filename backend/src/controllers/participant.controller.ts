import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode, Patch, ConflictException, NotFoundException } from '@nestjs/common';
import { ParticipantService } from '../services/participant.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags("Participant")
@Controller('participant')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  // Mengambil partisipan dari suatu retro
  @Get('v1/retros/:retro_id')
  @ApiOperation({ summary: "Get participants by retro ID"})
  async findByRetroId(@Param('retro_id') retro_id: string) {
    return this.participantService.findByRetroId(retro_id);
  }

  // Mengubah peran partisipan menjadi fasilitator pada suatu retro
  @Patch('v1/retros/:retro_id/participant/:participant_id/update-role')
  @ApiOperation({ summary: "Update participant role to facilitator" })
  async updateFacilitator(@Param('retro_id') retro_id: string, @Param('participant_id') participant_id: number) {
    return this.participantService.updateRoleFacilitator(retro_id, participant_id);
  }
  

} 