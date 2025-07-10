import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { LabelsGroupService } from '../services/group.service';

@Controller('labels-group')
export class LabelsGroupController {
  constructor(private readonly labelsGroupService: LabelsGroupService) {}

  @Post()
  async create(@Body() body: { label: string, retroId: string, itemId: string }) {
    return this.labelsGroupService.createLabelGroup(body.label, body.retroId, body.itemId);
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