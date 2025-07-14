import { Controller, Get, Query, ParseIntPipe, Param } from '@nestjs/common';
import { RetroService } from '../services/retro.service';
import { ParticipantService } from '../services/participant.service';
import { RetroItemsService } from '../services/item.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly retroService: RetroService,
    private readonly participantService: ParticipantService,
    private readonly itemService: RetroItemsService,
  ) {}

  @Get('retros')
    async getRetros(
      @Query('userId') userId: string,
      @Query('page', new ParseIntPipe({ optional: true })) page = 1,
      @Query('limit', new ParseIntPipe({ optional: true })) limit = 3,
    ) {
    const offset = (page - 1) * limit;
    
    const [retros, total] = await this.retroService.findWithPagination(userId, limit, offset);
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

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    const totalRetros = await this.retroService.count(userId);
    
    // Count active retros (status = 'ongoing' only)
    const activeRetros = await this.retroService.countByStatus('ongoing', userId);
    
    // Count completed retros (status = 'completed')
    const completedRetros = await this.retroService.countByStatus('completed', userId);

    const response = {
      totalRetros,
      activeRetros,
      completedRetros,
    };
    return response;
  }
} 