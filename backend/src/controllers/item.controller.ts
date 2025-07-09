import { Controller, Post, Body, Get, Param, Delete, Put, Req, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { RetroItemsService } from '../services/item.service';
import { CreateRetroItemDto } from '../dto/create-item.dto';
import { Request } from 'express';

@Controller('retros/:retroId/items')
export class RetroItemsController {
  constructor(private readonly retroItemsService: RetroItemsService) {}

  @Post()
  create(@Param('retroId') retroId: string, @Body() body: any) {
    // Map frontend data to backend DTO
    const dto: CreateRetroItemDto = {
      content: body.content,
      retro_id: retroId,
      created_by: body.created_by || body.author, // Handle both field names
      format_type: body.category as any, // Map category to format_type
    };
    
    return this.retroItemsService.create(dto);
  }

  @Get()
  findAll(@Param('retroId') retroId: string) {
    return this.retroItemsService.findByRetroId(retroId);
  }

  @Put(':itemId')
  async update(
    @Param('retroId') retroId: string,
    @Param('itemId') itemId: string,
    @Body() body: { content: string; userId?: string },
    @Req() req: Request
  ) {
    // Extract user ID from request body or headers
    const userId = body.userId || this.extractUserId(req);
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    return this.retroItemsService.update(itemId, body.content, userId, retroId);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('retroId') retroId: string,
    @Param('itemId') itemId: string,
    @Req() req: Request
  ) {
    // Extract user ID from request (assuming it's in headers or body)
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    await this.retroItemsService.remove(itemId, userId, retroId);
    
    // Return a success response
    return { 
      success: true, 
      message: 'Item deleted successfully',
      itemId: itemId 
    };
  }

  private extractUserId(req: Request): string | null {
    // Try to get user ID from different sources
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Decode JWT token to get user ID
        const jwtService = new (require('@nestjs/jwt').JwtService)();
        const token = authHeader.substring(7);
        const payload = jwtService.decode(token);
        return payload?.sub || payload?.userId;
      } catch (error) {
        console.log('Error decoding JWT:', error.message);
      }
    }

    // Fallback to body or query
    return (req.body as any)?.userId || (req.query as any)?.userId || null;
  }
}
