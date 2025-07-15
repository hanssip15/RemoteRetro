import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Retro } from './retro.entity';

@Entity('action_items')
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  retro_id: string;

  @Column({ type: 'varchar' })
  action_item: string;

  @Column({ type: 'varchar'})
  assign_to : string

  @ManyToOne(() => Retro, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;
}
