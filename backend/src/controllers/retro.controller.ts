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
    console.log('📋 === GET /retros ===');
    console.log('👤 User from JWT:', req.user);
    const retros = await this.retroService.findAll();
    console.log('📊 Retros fetched:', retros.length);
    return retros;
  }

  @Get('test')
  async testEndpoint(@Req() req: Request) {
    console.log('🧪 === TEST ENDPOINT ===');
    console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('👤 Request user:', req.user);
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔑 JWT Token:', token.substring(0, 50) + '...');
      
      try {
        const jwtService = new (require('@nestjs/jwt').JwtService)();
        const payload = jwtService.decode(token);
        console.log('🔍 JWT Payload:', JSON.stringify(payload, null, 2));
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
    console.log(`=== GET /retros/${id} ===`);
    const { retro, participants } = await this.retroService.findOne(id);
    return { retro, participants };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRetroDto: CreateRetroDto, @Req() req: Request) {
    console.log('🚀 === RETRO CONTROLLER DEBUG ===');
    console.log('📝 Request reached controller');
    console.log('📦 Request body:', JSON.stringify(createRetroDto, null, 2));
    console.log('👤 Request user:', req.user);
    console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));

    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔑 JWT Token found:', token.substring(0, 50) + '...');
      
      try {
        // Decode JWT token to get user ID
        const jwtService = new (require('@nestjs/jwt').JwtService)();
        const payload = jwtService.decode(token);
        console.log('🔍 JWT Payload:', JSON.stringify(payload, null, 2));
        userId = payload?.sub || payload?.userId;
        console.log('🆔 User ID extracted:', userId);
      } catch (error) {
        console.log('❌ Error decoding JWT:', error.message);
      }
    } else {
      console.log('⚠️ No Authorization header found');
    }

    console.log('✅ Creating retro with user ID:', userId);
    return this.retroService.create(createRetroDto, userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRetroDto: UpdateRetroDto) {
    console.log(`=== PUT /retros/${id} ===`);
    const retro = await this.retroService.updateStatus(id, updateRetroDto);
    return retro;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.retroService.remove(id);
  }

  @Get('debug/latest')
  async getLatestRetro() {
    console.log('🔍 === DEBUG LATEST RETRO ===');
    try {
      const retros = await this.retroService.findAll();
      const latestRetro = retros[0]; // Assuming they're ordered by creation date
      console.log('📊 Latest retro:', JSON.stringify(latestRetro, null, 2));
      return {
        message: 'Latest retro found',
        retro: latestRetro,
        totalRetros: retros.length
      };
    } catch (error) {
      console.log('❌ Error getting latest retro:', error.message);
      return { error: error.message };
    }
  }
} 