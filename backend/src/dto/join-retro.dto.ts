import { IsString, IsNotEmpty } from 'class-validator';

export class JoinRetroDto {
  @IsString()
  @IsNotEmpty()
  name: string;
} 