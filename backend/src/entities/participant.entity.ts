// src/entities/participant.entity.ts
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

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'retro_id' })
  retroId: string;

  @ManyToOne(() => Retro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: false })
  role: boolean; // true = facilitator

  @CreateDateColumn({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;
}
