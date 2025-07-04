import { IsString, IsOptional } from 'class-validator';

export class UpdateRetroDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
} 