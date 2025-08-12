import { Controller, Post, Body, Get, Param, Delete, Patch, Req, ForbiddenException, HttpCode, HttpStatus, Query, Put } from '@nestjs/common';
import { RetroItemsService } from '../services/item.service';
import { CreateRetroItemDto } from '../dto/create-item.dto';
import { Request } from 'express';

@Controller('group-item')
export class RetroItemsController {
  constructor(private readonly retroItemsService: RetroItemsService) {}
  // Membuat item baru untuk suatu retro
  @Post('v1/retros/:retro_id/create')
  create(@Param('retro_id') retro_id: string, @Body() body: any) {
    // Map frontend data to backend DTO
    const dto: CreateRetroItemDto = {
      content: body.content,
      retro_id: retro_id,
      created_by: body.created_by || body.author, // Handle both field names
      format_type: body.category as any, // Map category to format_type
    };
    
    return this.retroItemsService.create(dto);
  }
  // Mendapatkan items dari suatu retro
  @Get('v1/retros/:retro_id')
  findAll(@Param('retro_id') retro_id: string) {
    return this.retroItemsService.findByRetroId(retro_id);
  }
  // Mengupdate item pada suatu retro
  @Patch('v1/retros/:retro_id/item/:item_id/update-item')
  async update(@Param('retro_id') retro_id: string,@Param('item_id') itemId: string,@Body() body: { content: string; category: string; userId?: string },@Req() req: Request
  ) {
    const userId = body.userId || this.extractUserId(req);
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
    return this.retroItemsService.update(itemId, body.content, body.category, userId, retro_id);
  }

  @Delete('v1/retros/:retro_id/item/:item_id/delete-item')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('retro_id') retroId: string,
    @Param('item_id') itemId: string,
    @Body() body: { userId?: string },
    @Req() req: Request
  ) {
    const userId = body.userId || this.extractUserId(req);
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
    await this.retroItemsService.remove(itemId, userId, retroId);    
    return { 
      success: true, 
      message: 'Item deleted successfully',
      itemId: itemId 
    };
  }




  private extractUserId(req: Request): string | null {
    // Try to get user ID from request body first
    if ((req.body as any)?.userId) {
      return (req.body as any).userId;
    }

    // Try to get from query parameters
    if ((req.query as any)?.userId) {
      return (req.query as any).userId;
    }

    // Try to get from headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Simple base64 decode for JWT payload (second part)
        const token = authHeader.substring(7);
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          return payload?.sub || payload?.userId || payload?.id || payload?.user_id;
        }
      } catch (error) {
        console.log('Error decoding JWT:', error.message);
      }
    }

    return null;
  }
}
