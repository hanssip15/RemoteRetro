import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Retro } from './retro.entity';
import { RetroItem } from './retro-item.entity';
import { GroupEntity } from './group.entity';

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

  @ManyToOne(() => GroupEntity, (group) => group.group_items)
  @JoinColumn({ name: 'group_id' })
  group: GroupEntity;

  @ManyToOne(() => RetroItem, (item) => item.group_items, { eager: false })
  @JoinColumn({ name: 'item_id' })
  item: RetroItem;

  // @ManyToOne(() => RetroItem, { eager: false }) // atur eager=false jika pakai `relations` manual
  // @JoinColumn({ name: 'item_id' })
  // item: RetroItem;
  

  constructor(partial: Partial<GroupItemEntity>) {
    Object.assign(this, partial);
  }
}
