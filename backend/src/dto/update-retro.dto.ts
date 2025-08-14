import { IsString, IsOptional } from 'class-validator';

export class UpdateRetroStatusDto {
  @IsOptional()
  @IsString()
  status?: string;
} 