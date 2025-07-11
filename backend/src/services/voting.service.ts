import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabelsGroup } from '../entities/group.entity';
import { CreateVoteDto, SubmitVotesDto } from '../dto/create-vote.dto';
import { ParticipantGateway } from '../gateways/participant.gateways';

// In-memory storage for user votes (will be cleared when votes are submitted)
const userVotes: {
  [retroId: string]: {
    [userId: string]: {
      [groupLabel: string]: number;
    };
  };
} = {};

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(LabelsGroup)
    private labelsGroupRepository: Repository<LabelsGroup>,
    private readonly participantGateway: ParticipantGateway,
  ) {}

  // Store user vote in memory
  async storeUserVote(voteData: CreateVoteDto): Promise<void> {
    const { retroId, userId, groupLabel, voteCount } = voteData;

    // Initialize if not exists
    if (!userVotes[retroId]) {
      userVotes[retroId] = {};
    }
    if (!userVotes[retroId][userId]) {
      userVotes[retroId][userId] = {};
    }

    // Store the vote
    userVotes[retroId][userId][groupLabel] = voteCount;

    console.log(`🗳️ Stored vote for user ${userId} in retro ${retroId}: ${groupLabel} = ${voteCount}`);
    
    // Broadcast vote update to all participants
    this.participantGateway.broadcastVoteUpdate(retroId, {
      userId,
      groupLabel,
      voteCount,
      timestamp: new Date().toISOString()
    });
  }

  // Get all votes for a retro
  async getUserVotes(retroId: string): Promise<any> {
    return userVotes[retroId] || {};
  }

  // Submit all votes to database (called by facilitator)
  async submitVotes(submitData: SubmitVotesDto): Promise<void> {
    const { retroId, facilitatorId } = submitData;
    
    console.log(`📊 Submitting votes for retro ${retroId} by facilitator ${facilitatorId}`);

    // Get all votes for this retro
    const allVotes = userVotes[retroId];
    if (!allVotes) {
      console.log('No votes found for this retro');
      return;
    }

    // Calculate total votes per group
    const groupVotes: { [groupLabel: string]: number } = {};
    
    Object.values(allVotes).forEach((userVoteData: any) => {
      Object.entries(userVoteData).forEach(([groupLabel, voteCount]) => {
        if (!groupVotes[groupLabel]) {
          groupVotes[groupLabel] = 0;
        }
        groupVotes[groupLabel] += voteCount as number;
      });
    });

    console.log('📈 Calculated group votes:', groupVotes);

    // Update database with vote counts
    for (const [groupLabel, totalVotes] of Object.entries(groupVotes)) {
      await this.labelsGroupRepository.update(
        { retro_id: retroId, label: groupLabel },
        { votes: totalVotes }
      );
    }

    console.log('✅ Votes submitted to database');

    // Clear in-memory votes for this retro
    delete userVotes[retroId];

    // Broadcast vote submission to all participants
    this.participantGateway.broadcastVoteSubmission(retroId, {
      facilitatorId,
      groupVotes,
      timestamp: new Date().toISOString()
    });
  }

  // Get vote results from database
  async getVoteResults(retroId: string): Promise<LabelsGroup[]> {
    return this.labelsGroupRepository.find({
      where: { retro_id: retroId },
      relations: ['item'],
      order: { votes: 'DESC', id: 'ASC' }
    });
  }
} 