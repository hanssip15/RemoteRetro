// email.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ActionItemDto {
  @ApiProperty({ example: 'Do code review regularly', description: 'Penjelasan tugas' })
  @IsNotEmpty()
  @IsString()
  task: string;

  @ApiProperty({ example: 'John Doe', description: 'Nama Penanggung Jawab' })
  @IsNotEmpty()
  @IsString()
  assignee_name: string;
}

export class SendActionItemsEmailDto {
  @ApiProperty({ example: 'Weekly Retro Meeting', description: 'Judul retro' })
  @IsNotEmpty()
  @IsString()
  retro_title: string;

  @ApiProperty({
    description: 'Daftar action items',
    type: [ActionItemDto],
    example: [
      { task: 'Do code review regularly', assignee_name: 'John Doe' },
      { task: 'Improve test coverage', assignee_name: 'Jane Smith' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionItemDto)
  action_items: ActionItemDto[];

  @ApiProperty({
    description: 'Daftar email peserta',
    type: [String],
    example: ['user1@example.com', 'user2@example.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  participant_emails: string[];
}
