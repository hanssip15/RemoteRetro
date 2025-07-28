import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateRetroDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsString()
  createdBy: string;

  @IsString()
  facilitator: string;

} 