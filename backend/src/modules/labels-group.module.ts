import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabelsGroupController } from '../controllers/labels-group.controller';
import { LabelsGroupService } from '../services/labels-group.service';
import { LabelsGroup } from '../entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LabelsGroup])],
  controllers: [LabelsGroupController],
  providers: [LabelsGroupService],
  exports: [LabelsGroupService],
})
export class LabelsGroupModule {} 