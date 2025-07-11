import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsUUID()
  retro_id: string;

  @IsNotEmpty()
  @IsUUID()
  item_id: string;

}
