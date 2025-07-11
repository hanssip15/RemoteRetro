import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateGroupDto } from '../dto/create-group.dto'; // Adjust the import path as necessary

@Injectable()
export class LabelsGroupService {
  constructor(private prisma: PrismaService) {}

  async createLabelGroup(createGroupDto: CreateGroupDto) {
    return this.prisma.labelsGroup.create({
      data: {
        label: createGroupDto.label,
        retro_id: createGroupDto.retro_id,
        item_id: createGroupDto.item_id,
      },
    });
  }

  async getLabelsByRetro(retroId: string) {
    return this.prisma.labelsGroup.findMany({
      where: { retro_id: retroId },
    });
  }

  async updateLabel(id: number, label: string) {
    return this.prisma.labelsGroup.update({
      where: { id },
      data: { label },
    });
  }

  async deleteLabel(id: number) {
    return this.prisma.labelsGroup.delete({
      where: { id },
    });
  }
}