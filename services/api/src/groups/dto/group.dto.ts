import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsIn, Length } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'グループ名', example: '田中家' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'グループの説明', example: '家族の買い物リスト', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

export class UpdateGroupDto {
  @ApiProperty({ description: 'グループ名', example: '田中家', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({ description: 'グループの説明', example: '家族の買い物リスト', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

export class JoinGroupDto {
  @ApiProperty({ description: '招待コード', example: 'FAMILY123456' })
  @IsString()
  @Length(12, 12)
  invite_code: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ description: 'メンバーの役割', example: 'member', enum: ['owner', 'member'] })
  @IsString()
  @IsIn(['owner', 'member'])
  role: 'owner' | 'member';
}

export class GroupResponseDto {
  @ApiProperty({ description: 'グループID' })
  id: string;

  @ApiProperty({ description: 'グループ名' })
  name: string;

  @ApiProperty({ description: 'グループの説明' })
  description?: string;

  @ApiProperty({ description: '招待コード' })
  invite_code: string;

  @ApiProperty({ description: '作成者ID' })
  created_by: string;

  @ApiProperty({ description: '作成日時' })
  created_at: Date;

  @ApiProperty({ description: 'メンバー数' })
  member_count?: number;

  @ApiProperty({ description: '自分の役割' })
  my_role?: 'owner' | 'member';
}

export class GroupMemberResponseDto {
  @ApiProperty({ description: 'ユーザーID' })
  user_id: string;

  @ApiProperty({ description: '表示名' })
  display_name: string;

  @ApiProperty({ description: 'アバターURL' })
  avatar_url?: string;

  @ApiProperty({ description: '役割' })
  role: 'owner' | 'member';

  @ApiProperty({ description: '参加日時' })
  joined_at: Date;
}

export class InviteCodeResponseDto {
  @ApiProperty({ description: '招待コード' })
  invite_code: string;

  @ApiProperty({ description: '招待URL' })
  invite_url: string;

  @ApiProperty({ description: 'QRコード用データ' })
  qr_data: string;
}