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
  async findAll() {
    console.log('=== GET /retros ===');
    const retros = await this.retroService.findAll();
    console.log('Retros fetched:', retros.length);
    return retros;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`=== GET /retros/${id} ===`);

    const result = await this.retroService.findOne(id);
    return result;
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRetroDto: CreateRetroDto, @Req() req: Request) {
    console.log('=== RETRO CONTROLLER DEBUG ===');
    console.log('Request reached controller');
    console.log('Request body:', createRetroDto);
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);

    return this.retroService.create(createRetroDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRetroDto: UpdateRetroDto) {
    console.log(`=== PUT /retros/${id} ===`);

    const retro = await this.retroService.update(id, updateRetroDto);
    return retro;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.retroService.remove(id);
  }
} 