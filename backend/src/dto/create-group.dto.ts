import { IsNotEmpty, IsUUID, IsString, IsNumber } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsString()
  retro_id: string;

  @IsNotEmpty()
  @IsNumber()
  votes: number;

}
