// src/entities/retro-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Retro } from './retro.entity';
import { User } from './user.entity';

export type RetroItemType = 'went_well' | 'improve' | 'action_item';

@Entity('retro_items')
export class RetroItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'retro_id' })
  retroId: string;

  @ManyToOne(() => Retro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;

  @Column({ type: 'varchar', length: 50 })
  type: RetroItemType;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'int', default: 0 })
  votes: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
