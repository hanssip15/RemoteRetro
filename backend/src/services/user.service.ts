// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity'; // Adjust the import path as necessary

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async create(user: Partial<User>): Promise<User> {
    console.log('UsersService.create called with:', user);
    const newUser = this.usersRepository.create(user);
    console.log('Created user entity:', newUser);
    const savedUser = await this.usersRepository.save(newUser);
    console.log('Saved user to database:', savedUser);
    return savedUser;
  }
}
