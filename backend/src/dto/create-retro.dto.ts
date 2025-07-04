import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateRetroDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  duration?: number;
} 