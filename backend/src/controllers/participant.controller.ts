import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { ParticipantService } from '../services/participant.service';
import { JoinRetroDto } from '../dto/join-retro.dto';

@Controller('retros/:retroId/participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Get()
  async findByRetroId(@Param('retroId') retroId: string) {
    return this.participantService.findByRetroId(retroId);
  }
  
  // @Post('join')
  // @HttpCode(HttpStatus.CREATED)
  // async join(@Param('retroId') retroId: string, @Body() joinRetroDto: JoinRetroDto) {
  //   return this.participantService.join(retroId, joinRetroDto);
  // }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.participantService.remove(id);
  }
} 