// src/group/group.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupService } from '../services/group.service';
import { GroupItemService } from '../services/group-item.service';
import { GroupController } from '../controllers/group.controller';
import { PrismaService } from '../services/prisma.service';
import { GroupItemEntity } from '../entities/group-item.entity';
import { GroupEntity } from '../entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupItemEntity, GroupEntity])],
  controllers: [GroupController],
  providers: [GroupService, GroupItemService, PrismaService],
  exports: [GroupService, GroupItemService, PrismaService],
})
export class GroupModule {}
