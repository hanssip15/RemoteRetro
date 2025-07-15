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
      assign_to: dto.assign_to,
    });
    const savedAction = await this.actionRepository.save(newAction);

    return savedAction;
  }

  async bulkCreate(dtos: CreateActionDto[]) {
    // Validasi retro_id sama untuk semua
    if (dtos.length === 0) return [];
    const retroId = dtos[0].retro_id;
    const retro = await this.retroRepository.findOne({ where: { id: retroId } });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${retroId} not found`);
    }
    // Buat array entity
    const actions = dtos.map(dto => this.actionRepository.create({
      retro_id: dto.retro_id,
      action_item: dto.action_item,
      assign_to: dto.assign_to,
    }));
    // Simpan sekaligus
    const savedActions = await this.actionRepository.save(actions);
    return savedActions;
  }

  async findAll() {
    return this.actionRepository.find();
  }

  async findByRetroId(retroid : string){
    return this.actionRepository.find({
      where: {
        retro_id: retroid,
      }
    });
  }
}
