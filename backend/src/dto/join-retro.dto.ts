import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class JoinRetroDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  @IsNotEmpty()
  role: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
} 