import { IsString, IsOptional, IsEnum, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system',
  ORDER_UPDATE = 'order_update',
  RECEIPT_SHARED = 'receipt_shared',
}

export enum ChatStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  attachment_url?: string;

  @IsOptional()
  @IsString()
  attachment_type?: string; // 'image/jpeg', 'image/png', etc.

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateChatDto {
  @IsUUID()
  order_id: string;

  @IsUUID()
  user_id: string;

  @IsUUID()
  shopper_id: string;

  @IsOptional()
  @IsString()
  initial_message?: string;
}

export class ChatMessageResponseDto {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: 'user' | 'shopper' | 'system';
  content: string;
  type: MessageType;
  attachment_url?: string;
  attachment_type?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  read_at?: Date;
}

export class ChatResponseDto {
  id: string;
  order_id: string;
  user_id: string;
  shopper_id: string;
  status: ChatStatus;
  created_at: Date;
  updated_at: Date;
  last_message?: ChatMessageResponseDto;
  unread_count?: number;
}

export class MarkAsReadDto {
  @IsArray()
  @IsUUID('4', { each: true })
  message_ids: string[];
}

export class UploadAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  content_type: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AttachmentResponseDto {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  upload_url?: string; // For direct upload to S3
  created_at: Date;
}

// WebSocket event DTOs
export class JoinChatDto {
  @IsUUID()
  chat_id: string;
}

export class LeaveChatDto {
  @IsUUID()
  chat_id: string;
}

export class TypingIndicatorDto {
  @IsUUID()
  chat_id: string;

  @IsString()
  @IsEnum(['start', 'stop'])
  action: 'start' | 'stop';
}

// Push notification DTOs
export class PushKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

export class SendNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions?: NotificationActionDto[];
}

export class NotificationActionDto {
  @IsString()
  action: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  order_updates?: boolean;

  @IsOptional()
  chat_messages?: boolean;

  @IsOptional()
  promotional?: boolean;

  @IsOptional()
  system_alerts?: boolean;
}