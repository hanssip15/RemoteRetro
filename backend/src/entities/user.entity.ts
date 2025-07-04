// src/users/user.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;
}
