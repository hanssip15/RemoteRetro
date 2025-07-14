import { IsString, IsNumber, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  retroId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  groupLabel: string;

  @IsNumber()
  @IsNotEmpty()
  voteCount: number;
}

export class SubmitVotesDto {
  @IsString()
  @IsNotEmpty()
  retroId: string;

  @IsString()
  @IsNotEmpty()
  facilitatorId: string;
} 