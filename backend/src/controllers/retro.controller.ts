import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { RetroService } from '../services/retro.service';
import { CreateRetroDto } from '../dto/create-retro.dto';
import { UpdateRetroDto } from '../dto/update-retro.dto';

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
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRetroDto: CreateRetroDto) {
    console.log('=== POST /retros STARTED ===');
    console.log('Request body:', createRetroDto);

    // Validation
    if (!createRetroDto.title || typeof createRetroDto.title !== 'string' || createRetroDto.title.trim().length === 0) {
      console.error('Invalid title:', createRetroDto.title);
      return { error: 'Title is required' };
    }

    const cleanData = {
      title: createRetroDto.title.trim(),
      description: createRetroDto.description || undefined,
    };

    console.log('Clean data for insert:', cleanData);

    try {
      const retro = await this.retroService.create(cleanData);
      console.log('=== POST /retros SUCCESS ===');
      console.log('Returning retro with ID:', retro.id);
      return retro;
    } catch (error) {
      console.error('=== POST /retros ERROR ===');
      console.error('Error details:', error);
      throw error;
    }
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