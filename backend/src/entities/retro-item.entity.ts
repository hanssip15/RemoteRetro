import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Retro } from './retro.entity';
import { GroupItemEntity } from './group-item.entity';

export enum RetroFormatTypes {
  format_1 = 'format_1',
  format_2 = 'format_2',
  format_3 = 'format_3',
}

@Entity('retro_items')
export class RetroItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column()
  retro_id: string;

  @ManyToOne(() => Retro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;

  @Column()
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'enum', enum: RetroFormatTypes })
  format_type: RetroFormatTypes;

  @Column({ default: false })
  is_edited: boolean;

  @OneToMany(() => GroupItemEntity, (groupItem) => groupItem.item)
  group_items: GroupItemEntity[];
}

