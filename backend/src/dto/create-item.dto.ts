import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  author?: string;
} 