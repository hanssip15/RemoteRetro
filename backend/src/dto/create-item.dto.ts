import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsEnum } from 'class-validator';
import { RetroFormatTypes } from 'src/entities/retro-item.entity';

export class CreateRetroItemDto {
  @ApiProperty({ example: 'This is a retro item', description: 'The content of the retro item' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'user-uuid', description: 'The ID of the user who created the retro item' })
  @IsNotEmpty()
  @IsUUID()
  created_by: string;

  @ApiProperty({ example: RetroFormatTypes.format_1, description: 'The format type of the retro item' })
  @IsNotEmpty()
  @IsEnum(RetroFormatTypes)
  format_type: RetroFormatTypes;
}

export class UpdateItemDto {
  @ApiProperty({ example: 'This is an updated retro item', description: 'The content of the retro item' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: RetroFormatTypes.format_2, description: 'The format type of the retro item' })
  @IsNotEmpty()
  @IsEnum(RetroFormatTypes)
  format_type: RetroFormatTypes;
}
