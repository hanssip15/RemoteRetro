import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRetroDto {

  @ApiProperty({ description: 'Title of new retro' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of new retro' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiProperty({ description: 'Creator of the retro' })
  @IsString()
  createdBy: string;

  @ApiProperty({ description: 'Facilitator of the retro' }) 
  @IsString()
  facilitator: string;

} 