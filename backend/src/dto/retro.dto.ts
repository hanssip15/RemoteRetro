import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRetroDto {
  @ApiProperty({ example: 'Sprint 12 Retrospective', description: 'Judul retro' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'happy_sad_confused', description: 'Format retro (opsional)' })
  @IsOptional()
  @IsString()
  format: string;

  @ApiProperty({ example: 'user123', description: 'ID pembuat retro' })
  @IsString()
  createdBy: string;

  @ApiProperty({ example: 'facilitator123', description: 'ID fasilitator retro' })
  @IsString()
  facilitator: string;
}

export class UpdateStatusDto {
  @ApiProperty({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'],description: 'New retro status'})
  @IsIn(['draft', 'ongoing', 'completed'])  
  @IsString()
  @IsNotEmpty()
  status : string;  
}
export class UpdatePhaseDto{
  @ApiProperty({ example: 'grouping', enum: [  'prime-directive',   'ideation',   'grouping',   'labelling',   'voting',   'final',   'ActionItems'], description: 'New Retro Phase'})
  @IsIn(['prime-directive', 'ideation', 'grouping', 'labelling', 'voting', 'final', 'ActionItems'])
  @IsString()
  @IsNotEmpty()
  phase : string
}