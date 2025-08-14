import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RetroService } from '../services/retro.service';
import { CreateRetroDto, UpdatePhaseDto, UpdateStatusDto } from '../dto/retro.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';



@Controller('retro')  
export class RetroController {
  constructor(private readonly retroService: RetroService) {}
  // Mendapatkan retro berdasarkan retroId
  @Get('v1/retros/:retro_id')
  @ApiOperation({ summary: 'Get retro by ID' })
  async findOne(@Param('retro_id') retro_id: string) {
    const { retro, participants } = await this.retroService.findOne(retro_id);
    return { retro, participants };
  }

  // Membuat room / retro baru
  @Post('v1/retros/create')
  @ApiOperation({ summary: 'Create a new retro' })
  @ApiBody({ type: CreateRetroDto })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRetroDto: CreateRetroDto) {
    return this.retroService.create(createRetroDto);
  }
  // Mengubah status retro
  @Patch('v1/retros/:retro_id/update-status')
  @ApiOperation({ summary: 'Update retro status' })
  async updateRetroStatus(@Param('retro_id') retro_id: string, @Body() dto: UpdateStatusDto ) {
    const retro = await this.retroService.updateRetroStatus(retro_id, dto.status);
    return retro;
  }
  
  // Mengubah phase retro
  @Patch('v1/retros/:retro_id/update-phase')
  @ApiOperation({ summary: 'Update retro phase' })
  async updateRetroPhase(@Param('retro_id') retro_id: string, @Body() dto: UpdatePhaseDto) {
    const retro = await this.retroService.updateRetroPhase(retro_id, dto.phase);
    return retro;
  }
}