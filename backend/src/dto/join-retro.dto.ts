import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class JoinRetroDto {

  @ApiProperty({example:"false", description: "User role"})
  @IsBoolean()
  @IsNotEmpty()
  role: boolean;

  @ApiProperty({example:"true", description: "Is active ?"})
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
} 