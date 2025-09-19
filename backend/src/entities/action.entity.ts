import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,CreateDateColumn } from 'typeorm';
import { Retro } from './retro.entity';
import {User} from './user.entity'
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

  @Column({ type: 'varchar'})
  assign_to_id : string

  @Column({ type: 'varchar'})
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ default: false })
  is_edited: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => Retro, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'retro_id' })
  retro: Retro;
}
