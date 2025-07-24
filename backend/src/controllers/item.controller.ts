import { Controller, Post, Body, Get, Param, Delete, Put, Req, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { RetroItemsService } from '../services/item.service';
import { CreateRetroItemDto } from '../dto/create-item.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
@UseGuards(AuthGuard('jwt')) // memastikan route dilindungi
async update(
  @Param('retroId') retroId: string,
  @Param('itemId') itemId: string,
  @Body() body: { content: string; category: string },
  @Req() req: Request
) {
  const user = req.user as any; // kamu bisa buat interface untuk type user
  const userId = user?.sub; // pastikan `sub` adalah ID user dari JWT payload

  if (!userId) {
    throw new ForbiddenException('User ID is required');
  }

  return this.retroItemsService.update(itemId, body.content, body.category, userId, retroId);
}
  @Delete(':itemId')
  @UseGuards(AuthGuard('jwt')) // memastikan route dilindungi
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('retroId') retroId: string,
    @Param('itemId') itemId: string,
    @Req() req: Request
  ) {
    // Extract user ID from request (assuming it's in headers or body)
    const user = req.user as any; // kamu bisa buat interface untuk type user
    const userId = user?.sub; // pastikan `sub` adalah ID user dari JWT payload

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


}
