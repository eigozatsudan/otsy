import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength, IsUrl } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content', example: 'Hey, should we buy organic milk?' })
  @IsString()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  body: string;

  @ApiProperty({ description: 'Optional item ID for threaded discussion', required: false })
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @ApiProperty({ description: 'Optional image URL', required: false })
  @IsOptional()
  @IsUrl()
  image_url?: string;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Group ID' })
  group_id: string;

  @ApiProperty({ description: 'Item ID for threaded discussion', required: false })
  item_id?: string;

  @ApiProperty({ description: 'Author ID' })
  author_id: string;

  @ApiProperty({ description: 'Author display name' })
  author_name: string;

  @ApiProperty({ description: 'Message content' })
  body: string;

  @ApiProperty({ description: 'Optional image URL', required: false })
  image_url?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Item name for threaded discussions', required: false })
  item_name?: string;
}

export class GroupMessagesResponseDto {
  @ApiProperty({ description: 'List of messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Whether there are more messages' })
  has_more: boolean;

  @ApiProperty({ description: 'Total message count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;
}

export class ItemThreadResponseDto {
  @ApiProperty({ description: 'Item ID' })
  item_id: string;

  @ApiProperty({ description: 'Item name' })
  item_name: string;

  @ApiProperty({ description: 'Thread messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Total message count in thread' })
  total: number;
}