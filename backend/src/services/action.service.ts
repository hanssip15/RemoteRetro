import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateActionDto, UpdateActionDto } from '../dto/create-action.dto';
import { Retro } from '../entities/retro.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Action } from '../entities/action.entity';
import { ParticipantGateway } from 'src/gateways/participant.gateways';
import { UsersService } from './user.service';

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private actionRepository: Repository<Action>,
    @InjectRepository(Retro)
    private retroRepository: Repository<Retro>,
    private readonly participantGateway: ParticipantGateway,
    private userService: UsersService

  ) {}



  async create(retro_id: string, dto: CreateActionDto) {
    const retro = await this.retroRepository.findOne({
      where: { id: retro_id }
    });
    if (!retro) {
      throw new NotFoundException(`Retro with ID ${retro_id} not found`);
    }
    const newAction = this.actionRepository.create({
      retro_id: retro.id,
      action_item: dto.action_item,
      assign_to: dto.assign_to,
      assign_to_id : dto.assign_to_id,
      created_by : dto.created_by
    });
    const savedAction = await this.actionRepository.save(newAction);
    this.participantGateway.broadcastActionItemsUpdate(retro_id)
    return savedAction;
  }


  async edit( id: number, dto: UpdateActionDto) {
    const action = await this.actionRepository.findOne({
      where: { id }
    });
    
    if (!action) {
      throw new NotFoundException(`Action not found `);
    }
    const retro_id = action.retro_id
    if (dto.action_item){
      action.action_item = dto.action_item
    }
    if (dto.assign_to_id){
      action.assign_to_id = dto.assign_to_id
      const user = await this.userService.findById(dto.assign_to_id)
      action.assign_to = user.name
    }
    action.is_edited = true
    const updatedAction = await this.actionRepository.save(action);
    this.participantGateway.broadcastActionItemsUpdate(retro_id)
    return updatedAction;
  }

  async delete(id : number) {
    const action = await this.actionRepository.findOne({
      where: { id }
    })
    if (!action) {
      throw new NotFoundException(`Action not found`);
    }
    const retro_id = action.retro_id
    await this.actionRepository.remove(action);
    this.participantGateway.broadcastActionItemsUpdate(retro_id)
  }

  async findByRetroId(retroid : string){
    return this.actionRepository.find({
      where: {
        retro_id: retroid,
      },
      order: {created_at: "ASC"}
    });
  }
}
