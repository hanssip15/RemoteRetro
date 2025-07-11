import { Controller, Post, Body, Get, Param, Put, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { LabelsGroupService } from '../services/group.service';
import { CreateGroupDto } from '../dto/create-group.dto'; // Adjust the import path as necessary
@Controller('labels-group')
export class LabelsGroupController {
  constructor(private readonly labelsGroupService: LabelsGroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) 
  async create(@Body() createGroupDto: CreateGroupDto) {
    return this.labelsGroupService.createLabelGroup(createGroupDto);
  }

  @Get(':retroId')
  async getByRetro(@Param('retroId') retroId: string) {
    return this.labelsGroupService.getLabelsByRetro(retroId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { label: string }) {
    return this.labelsGroupService.updateLabel(Number(id), body.label);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.labelsGroupService.deleteLabel(Number(id));
  }
}