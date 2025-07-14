import { IsString, IsArray, IsNotEmpty, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupItemDto {
  @IsString()
  @IsNotEmpty()
  group_id: number;

  @IsString()
  @IsNotEmpty()
  item_id: string;



} 