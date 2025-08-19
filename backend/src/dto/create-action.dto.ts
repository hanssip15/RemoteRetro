import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateActionDto {
  @ApiProperty({ description: 'The action item text' })
  @IsNotEmpty()
  @IsString()
  action_item: string;
  
  @ApiProperty({ description: 'The ID of the user to assign the action item to' })
  @IsNotEmpty()
  @IsString()
  assign_to: string;

}
