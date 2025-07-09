import { IsNotEmpty, IsUUID, IsString, IsEnum } from 'class-validator';
import { RetroFormatTypes } from 'src/entities/retro-item.entity';

export class CreateRetroItemDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsUUID()
  retro_id: string;

  @IsNotEmpty()
  @IsUUID()
  created_by: string;

  @IsNotEmpty()
  @IsEnum(RetroFormatTypes)
  format_type: RetroFormatTypes;
}
