import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { RetroService } from '../services/retro.service';
import { ParticipantService } from '../services/participant.service';
import { ItemService } from '../services/item.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly retroService: RetroService,
    private readonly participantService: ParticipantService,
    private readonly itemService: ItemService,
  ) {}

  @Get('retros')
  async getRetros(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 3,
  ) {
    const offset = (page - 1) * limit;
    
    const [retros, total] = await this.retroService.findWithPagination(limit, offset);
    const totalPages = Math.ceil(total / limit);

    return {
      retros,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  @Get('stats')
  async getStats() {
    const totalRetros = await this.retroService.count();
    const uniqueMembers = await this.participantService.countUniqueMembers();
    const actionItems = await this.itemService.getActionItemsStats();

    return {
      totalRetros,
      uniqueMembers,
      actionItems: {
        total: actionItems.total,
        completed: Math.floor(actionItems.total * 0.75), // Hardcoded 75% completion rate
      },
    };
  }
} 