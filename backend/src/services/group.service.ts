// src/group/group.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Prisma, Group } from '@prisma/client';
import { GroupEntity } from 'src/entities/group.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupDto } from 'src/dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private groupRepository: Repository<GroupEntity>,
    // private prisma: PrismaService,
  ) 
  {}

  async create(createGroupDto: CreateGroupDto ) {
    const group = this.groupRepository.create(createGroupDto);
    return this.groupRepository.save(group);
  }

  // async findAll() {
  //   return this.prisma.group.findMany({
  //     include: {
  //       groupItems: true,
  //       retro: true,
  //     },
  //   });
  // }

  // async findOne(id: number) {
  //   return this.prisma.group.findUnique({
  //     where: { id },
  //     include: {
  //       groupItems: true,
  //     },
  //   });
  // }

  // async update(id: number, data: Prisma.GroupUpdateInput) {
  //   return this.prisma.group.update({
  //     where: { id },
  //     data,
  //   });
  // }

  // async remove(id: number) {
  //   return this.prisma.group.delete({
  //     where: { id },
  //   });
  // }

  // // Method untuk mencari group berdasarkan retro_id dan label
  // async findByRetroAndLabel(retroId: string, label: string) {
  //   return this.prisma.group.findFirst({
  //     where: {
  //       retro_id: retroId,
  //       label: label,
  //     },
  //     include: {
  //       groupItems: true,
  //     },
  //   });
  // }

  // Method untuk mencari semua group berdasarkan retro_id
  // async findByRetroId(retroId: string) {
  //   return this.prisma.group.findMany({
  //     where: {
  //       retro_id: retroId,
  //     },
  //     include: {
  //       groupItems: {
  //         include: {
  //           item: true,
  //         },
  //       },
  //     },
  //   });
  // }
}
