import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Retro } from './retro.entity';
import { RetroItem } from './retro-item.entity';

@Entity('labels_group') // nama tabel (bisa disesuaikan)
export class LabelsGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  label: string;

  @Column({ type: 'varchar'})
  retro_id: string;

  @Column({ type: 'uuid' })
  item_id: string;

  @Column({ type: 'int', nullable: true })
  votes: number;

  // Relations

  @ManyToOne(() => Retro, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;

  @ManyToOne(() => RetroItem, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: RetroItem;
}
