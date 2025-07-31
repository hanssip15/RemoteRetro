import { Controller, Post, Body, Get, Param, Delete, Put, Req, ForbiddenException, HttpCode, HttpStatus, Query } from '@nestjs/common';
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
    @Body() body: { content: string; category: string; userId?: string },
    @Req() req: Request
  ) {
    // Extract user ID from request body or headers
    const userId = body.userId || this.extractUserId(req);
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    return this.retroItemsService.update(itemId, body.content, body.category, userId, retroId);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('retroId') retroId: string,
    @Param('itemId') itemId: string,
    @Body() body: { userId?: string },
    @Req() req: Request
  ) {
    // Extract user ID from request body first, then try other sources
    const userId = body.userId || this.extractUserId(req);
    
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

  // Alternative DELETE endpoint using query parameter
  @Delete(':itemId/delete')
  @HttpCode(HttpStatus.OK)
  async removeWithQuery(
    @Param('retroId') retroId: string,
    @Param('itemId') itemId: string,
    @Query('userId') userId: string,
    @Req() req: Request
  ) {
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

  // Alternative PUT endpoint for delete (soft delete approach)
  @Put(':itemId/delete')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('retroId') retroId: string,
    @Param('itemId') itemId: string,
    @Body() body: { userId: string }
  ) {
    if (!body.userId) {
      throw new ForbiddenException('User ID is required');
    }

    await this.retroItemsService.remove(itemId, body.userId, retroId);
    
    // Return a success response
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
