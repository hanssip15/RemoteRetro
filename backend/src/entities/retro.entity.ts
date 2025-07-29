// src/entities/retro.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Participant } from './participant.entity';

@Entity('retros')
export class Retro {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  format: string;

  @Column({ type: 'varchar', length: 50, default: 'submit', name: 'current_phase' })
  currentPhase: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'facilitator' })
  facilitator: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Participant, participant => participant.retro)
  participants: Participant[];
}
