import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LabelsGroupService {
  constructor(private prisma: PrismaService) {}

  async createLabelGroup(label: string, retroId: string, itemId: string) {
    return this.prisma.labelsGroup.create({
      data: {
        label,
        retro_id: retroId,
        item_id: itemId,
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