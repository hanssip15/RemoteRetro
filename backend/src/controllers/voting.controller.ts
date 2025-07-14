// import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
// import { VotingService } from '../services/voting.service';
// import { CreateVoteDto, SubmitVotesDto } from '../dto/create-vote.dto';

// @Controller('voting')
// export class VotingController {
//   constructor(private readonly votingService: VotingService) {}

//   @Post('vote')
//   @HttpCode(HttpStatus.OK)
//   async storeVote(@Body() createVoteDto: CreateVoteDto) {
//     await this.votingService.storeUserVote(createVoteDto);
//     return { message: 'Vote stored successfully' };
//   }

//   @Post('submit')
//   @HttpCode(HttpStatus.OK)
//   async submitVotes(@Body() submitVotesDto: SubmitVotesDto) {
//     await this.votingService.submitVotes(submitVotesDto);
//     return { message: 'Votes submitted successfully' };
//   }

//   @Get('results/:retroId')
//   async getVoteResults(@Param('retroId') retroId: string) {
//     return this.votingService.getVoteResults(retroId);
//   }

//   @Get('user-votes/:retroId')
//   async getUserVotes(@Param('retroId') retroId: string) {
//     return this.votingService.getUserVotes(retroId);
//   }
// } 