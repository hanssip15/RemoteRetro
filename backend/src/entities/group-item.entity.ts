import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Retro } from './retro.entity';
import { RetroItem } from './retro-item.entity';
import { Group, GroupItem } from '@prisma/client';

@Entity('group_item')
export class GroupItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'uuid' })
  item_id: string;

  @Column({ type: 'int' })
  group_id: number;

  // item?: RetroItem;
  // group?: Group;

  constructor(partial: Partial<GroupItemEntity>) {
    Object.assign(this, partial);
  }
}
