import { IsNotEmpty, IsUUID, IsString, IsEnum } from 'class-validator';
import { RetroFormatTypes } from 'src/entities/retro-item.entity';

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
