import { IsString, IsArray, IsNotEmpty, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class GroupDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  itemIds: string[];
}

export class CreateLabelsGroupDto {
  @IsString()
  @IsNotEmpty()
  retro_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  groups: GroupDto[];
} 