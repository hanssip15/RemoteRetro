import { IsString, IsOptional } from 'class-validator';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  author?: string;
} 