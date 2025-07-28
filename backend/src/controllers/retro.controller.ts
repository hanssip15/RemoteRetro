import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RetroService } from '../services/retro.service';
import { CreateRetroDto } from '../dto/create-retro.dto';
import { UpdateRetroDto } from '../dto/update-retro.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('retros')
export class RetroController {
  constructor(private readonly retroService: RetroService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: Request) {
    const retros = await this.retroService.findAll();
    return retros;
  }

  @Get('test')
  async testEndpoint(@Req() req: Request) {

    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const jwtService = new (require('@nestjs/jwt').JwtService)();
        const payload = jwtService.decode(token);
        return { 
          message: 'Test endpoint working',
          user: payload,
          tokenPreview: token.substring(0, 50) + '...'
        };
      } catch (error) {
        return { 
          message: 'Test endpoint working but JWT decode failed',
          error: error.message 
        };
      }
    } else {
      return { 
        message: 'Test endpoint working but no JWT token found',
        headers: req.headers 
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { retro, participants } = await this.retroService.findOne(id);
    return { retro, participants };
  }

  @Post()
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
    } else {
    }

    return this.retroService.create(createRetroDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRetroDto: UpdateRetroDto) {
    const retro = await this.retroService.updateStatus(id, updateRetroDto);
    return retro;
  }

  @Put(':id/phase')
  async updatePhase(@Param('id') id: string, @Body() body: { phase: string }) {
    const retro = await this.retroService.updatePhase(id, body.phase);
    return retro;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.retroService.remove(id);
  }

  @Get('debug/latest')
  async getLatestRetro() {
    try {
      const retros = await this.retroService.findAll();
      const latestRetro = retros[0]; // Assuming they're ordered by creation date
      return {
        message: 'Latest retro found',
        retro: latestRetro,
        totalRetros: retros.length
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  @Delete(':id/participants/:participantId')
  async removeParticipant(@Param('id') id: string, @Param('participantId') participantId: string) {
    await this.retroService.leave(id, participantId);
  }
}