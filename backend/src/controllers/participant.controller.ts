import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode, Patch, ConflictException, NotFoundException } from '@nestjs/common';
import { ParticipantService } from '../services/participant.service';
import { JoinRetroDto } from '../dto/join-retro.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

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

  // Menambahkan partisipan pada suatu retro
  @Post('v1/retros/:retro_id/users/:user_id/join')
  @ApiOperation({ summary: "Join a retro" })
  @ApiBody({type: JoinRetroDto})
  @HttpCode(HttpStatus.CREATED)
  async joinRetro(
    @Param('retro_id') retro_id: string,
    @Param('user_id') user_id: string,
    @Body() joinRetroDto: JoinRetroDto) {
      const participant = await this.participantService.join(retro_id, user_id, joinRetroDto);
      if (!participant) {
        throw new ConflictException('Failed to join retro');
      }
      return participant;
    }

  // Mengubah peran partisipan menjadi fasilitator pada suatu retro
  @Patch('v1/retros/:retro_id/participant/:participant_id/update-role')
  @ApiOperation({ summary: "Update participant role to facilitator" })
  async updateFacilitator(@Param('retro_id') retro_id: string, @Param('participant_id') participant_id: string) {
    return this.participantService.updateRoleFacilitator(retro_id, participant_id);
  }
  

} 