import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';



  
export class  UpdateActionDto {

  @ApiProperty({ description: 'The action item text' })
  @IsNotEmpty()
  @IsString()
  action_item?: string;
  
  @ApiProperty({ description: 'The ID of the user to assign the action item to' })
  @IsNotEmpty()
  @IsString()
  assign_to_id?: string;
}



export class CreateActionDto {
  @ApiProperty({ description: 'The action item text' })
  @IsNotEmpty()
  @IsString()
  action_item: string;
  
  @ApiProperty({ description: 'The Name of the user to assign the action item to' })
  @IsNotEmpty()
  @IsString()
  assign_to: string;

  @ApiProperty({ description: 'The ID of the user to assign the action item to' })
  @IsNotEmpty()
  @IsString()
  assign_to_id: string;

  @ApiProperty({ description: 'The ID of the user who create task' })
  @IsNotEmpty()
  @IsString()
  created_by: string;

}
