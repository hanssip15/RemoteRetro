import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateActionDto } from '../dto/create-action.dto';
import { Retro } from '../entities/retro.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Action } from '../entities/action.entity';

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private actionRepository: Repository<Action>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>
  ) {}

  async create(dto: CreateActionDto) {
    const retro = await this.retroRepository.findOne({ where: { id: dto.retro_id } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${dto.retro_id} not found`);
    }

    const newAction = this.actionRepository.create({
      retro_id: dto.retro_id,
      action_item: dto.action_item,
    });
    const savedAction = await this.actionRepository.save(newAction);

    return savedAction;
  }

  async findAll() {
    return this.actionRepository.find();
  }
}
