import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RetroItem } from './retro-item.entity';
import { Participant } from './participant.entity';

@Entity('retros')
export class Retro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'team_size', type: 'int', nullable: true })
  teamSize: number;

  @Column({ type: 'int', default: 60 })
  duration: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RetroItem, item => item.retro)
  items: RetroItem[];

  @OneToMany(() => Participant, participant => participant.retro)
  participants: Participant[];
} 