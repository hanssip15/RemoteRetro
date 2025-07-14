import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Retro } from './retro.entity';
import { RetroItem } from './retro-item.entity';
import { GroupItemEntity } from './group-item.entity';

@Entity('group')
export class GroupEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'int', default: 0 })
  votes: number;

  @Column({ type: 'varchar' })
  retro_id: string;

  @ManyToOne(() => Retro, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;

  @OneToMany(() => GroupItemEntity, (groupItem) => groupItem.group)
  group_items: GroupItemEntity[];
  
  

  constructor(partial: Partial<GroupEntity>) {
    Object.assign(this, partial);
  }
}
