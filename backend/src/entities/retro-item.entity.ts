import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Retro } from './retro.entity';

@Entity('retro_items')
export class RetroItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'retro_id' })
  retroId: number;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author: string;

  @Column({ type: 'int', default: 0 })
  votes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Retro, retro => retro.items)
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;
} 