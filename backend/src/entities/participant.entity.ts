import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Retro } from './retro.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'retro_id' })
  retroId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'participant' })
  role: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @ManyToOne(() => Retro, retro => retro.participants)
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;
} 