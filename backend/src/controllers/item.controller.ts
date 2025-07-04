import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { ItemService } from '../services/item.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Controller('retros/:retroId/items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  async findByRetroId(@Param('retroId', ParseIntPipe) retroId: number) {
    return this.itemService.findByRetroId(retroId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('retroId', ParseIntPipe) retroId: number,
    @Body() createItemDto: CreateItemDto,
  ) {
    return this.itemService.create(retroId, createItemDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.itemService.remove(id);
  }

  @Post(':id/vote')
  async vote(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.vote(id);
  }
} 