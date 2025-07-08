import { IsString, IsOptional } from 'class-validator';

export class UpdateRetroDto {
  @IsOptional()
  @IsString()
  status?: string;
} 