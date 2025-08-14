// src/group/group.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupService } from '../services/group.service';
import { GroupController } from '../controllers/group.controller';
import { GroupItem } from '../entities/group-item.entity';
import { GroupEntity } from '../entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupItem, GroupEntity])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {} 
