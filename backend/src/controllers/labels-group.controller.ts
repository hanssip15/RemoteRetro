import { Controller, Post, Get, Put, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { LabelsGroupService } from '../services/labels-group.service';
import { CreateLabelsGroupDto } from '../dto/create-labels-group.dto';

@Controller('labels-group')
export class LabelsGroupController {
  constructor(private readonly labelsGroupService: LabelsGroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLabelsGroupDto: CreateLabelsGroupDto) {
    return this.labelsGroupService.create(createLabelsGroupDto);
  }

  @Get(':retroId')
  async findByRetroId(@Param('retroId') retroId: string) {
    return this.labelsGroupService.findByRetroId(retroId);
  }

  @Put(':id')
  async updateLabel(@Param('id') id: string, @Body() updateData: { label: string }) {
    return this.labelsGroupService.updateLabel(parseInt(id), updateData.label);
  }
} 