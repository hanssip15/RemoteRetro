import { Controller, Post, Body, Get, Param, Delete, Patch, Req, ForbiddenException, HttpCode, HttpStatus, Query, Put } from '@nestjs/common';
import { RetroItemsService } from '../services/item.service';
import { CreateRetroItemDto, UpdateItemDto } from '../dto/create-item.dto';
import { Request } from 'express';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Table } from 'typeorm';

@ApiTags('Item')
@Controller('item')
export class RetroItemsController {
  constructor(private readonly retroItemsService: RetroItemsService) {}
  // Membuat item baru untuk suatu retro
  @Post('v1/retros/:retro_id/create')
  @ApiOperation({ summary: 'Create a new retro item' })
  @ApiBody({ type: CreateRetroItemDto })
  create(@Param('retro_id') retro_id: string, @Body() body: any) {
    const dto: CreateRetroItemDto = {
      content: body.content,
      created_by: body.created_by || body.author, // Handle both field names
      format_type: body.category as any, // Map category to format_type
    };
    
    return this.retroItemsService.create(retro_id,dto);
  }
  // Memasukkan item ke dalam group
  @Post('v1/groups/:group_id/items/:item_id/insert')
  @ApiOperation({ summary: 'Insert an item into a group' })
  @HttpCode(HttpStatus.CREATED)
  async insert(@Param('group_id') group_id: number, @Param('item_id') item_id: string) {
    return this.retroItemsService.insert(item_id, group_id);
  }
  // Mendapatkan items dari suatu retro
  @Get('v1/retros/:retro_id')
  @ApiOperation({ summary: 'Get all items from a retro' })
  findAll(@Param('retro_id') retro_id: string) {
    return this.retroItemsService.findByRetroId(retro_id);
  }

  // Mengupdate item pada suatu retro
  @Patch('v1/items/:item_id/update-item')
  @ApiOperation({ summary: 'Update an item in a retro' })
  async update(@Param('item_id') itemId: string,@Body() dto: UpdateItemDto,@Req() req: Request
  ) {
    return this.retroItemsService.update(itemId, dto);
  }

  @Delete('v1/items/:item_id/delete-item')
  @HttpCode(HttpStatus.OK)
async remove(
    @Param('item_id') itemId: string,
  ) {
    await this.retroItemsService.remove(itemId);    
    return { 
      success: true, 
      message: 'Item deleted successfully',
      itemId: itemId 
    };
  }
}
