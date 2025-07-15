import { IsNotEmpty, IsString } from 'class-validator';

export class CreateActionDto {
  @IsNotEmpty()
  @IsString()
  action_item: string;

  @IsNotEmpty()
  @IsString()
  assign_to: string;

  @IsNotEmpty()
  retro_id: string;
}
