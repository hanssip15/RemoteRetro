import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RetroService } from '../services/retro.service';
import { CreateRetroDto } from '../dto/create-retro.dto';
import { UpdateRetroDto } from '../dto/update-retro.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('retro')  
export class RetroController {
  constructor(private readonly retroService: RetroService) {}
  // Mendapatkan retro berdasarkan retroId
  @Get('v1/retros/:retro_id')
  async findOne(@Param('retro_id') retro_id: string) {
    const { retro, participants } = await this.retroService.findOne(retro_id);
    return { retro, participants };
  }

  // Membuat room / retro baru
  @Post('v1/retros/create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRetroDto: CreateRetroDto, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Decode JWT token to get user ID
        const jwtService = new (require('@nestjs/jwt').JwtService)();
        const payload = jwtService.decode(token);
        userId = payload?.sub || payload?.userId;
      } catch (error) {
      }
    } 

    return this.retroService.create(createRetroDto);
  }

  // Mengubah status retro
  @Patch('v1/retros/:retro_id/update-status')
  async updateRetroStatus(@Param('retro_id') retro_id: string, @Body() updateRetroDto: UpdateRetroDto) {
    const retro = await this.retroService.updateRetroStatus(retro_id, updateRetroDto);
    return retro;
  }

  // Mengubah phase retro
  @Patch('v1/retros/:retro_id/update-phase')
  async updateRetroPhase(@Param('retro_id') retro_id: string, @Body() body: { phase: string }) {
    const retro = await this.retroService.updateRetroPhase(retro_id, body.phase);
    return retro;
  }
}