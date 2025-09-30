import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  JoinGroupDto,
  UpdateMemberRoleDto,
  GroupResponseDto,
  GroupMemberResponseDto,
  InviteCodeResponseDto,
} from './dto/group.dto';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'グループを作成' })
  @ApiResponse({ status: 201, description: 'グループが正常に作成されました', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: '無効な入力データ' })
  @ApiResponse({ status: 401, description: '認証が必要です' })
  async createGroup(@Request() req, @Body() createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    return this.groupsService.createGroup(req.user.id, createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: '自分のグループ一覧を取得' })
  @ApiResponse({ status: 200, description: 'グループ一覧', type: [GroupResponseDto] })
  @ApiResponse({ status: 401, description: '認証が必要です' })
  async getUserGroups(@Request() req): Promise<GroupResponseDto[]> {
    return this.groupsService.getUserGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'グループ詳細を取得' })
  @ApiResponse({ status: 200, description: 'グループ詳細', type: GroupResponseDto })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  async getGroupById(@Request() req, @Param('id') groupId: string): Promise<GroupResponseDto> {
    return this.groupsService.getGroupById(req.user.id, groupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'グループ情報を更新' })
  @ApiResponse({ status: 200, description: 'グループが正常に更新されました', type: GroupResponseDto })
  @ApiResponse({ status: 403, description: 'オーナー権限が必要です' })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  async updateGroup(
    @Request() req,
    @Param('id') groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.updateGroup(req.user.id, groupId, updateGroupDto);
  }

  @Post('join')
  @ApiOperation({ summary: '招待コードでグループに参加' })
  @ApiResponse({ status: 201, description: 'グループに正常に参加しました', type: GroupResponseDto })
  @ApiResponse({ status: 404, description: '無効な招待コード' })
  @ApiResponse({ status: 409, description: '既にグループのメンバーです' })
  async joinGroup(@Request() req, @Body() joinGroupDto: JoinGroupDto): Promise<GroupResponseDto> {
    return this.groupsService.joinGroup(req.user.id, joinGroupDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'グループメンバー一覧を取得' })
  @ApiResponse({ status: 200, description: 'メンバー一覧', type: [GroupMemberResponseDto] })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  async getGroupMembers(@Request() req, @Param('id') groupId: string): Promise<GroupMemberResponseDto[]> {
    return this.groupsService.getGroupMembers(req.user.id, groupId);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'メンバーの役割を更新' })
  @ApiResponse({ status: 200, description: 'メンバーの役割が正常に更新されました' })
  @ApiResponse({ status: 403, description: 'オーナー権限が必要です' })
  @ApiResponse({ status: 404, description: 'ユーザーまたはグループが見つかりません' })
  async updateMemberRole(
    @Request() req,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(req.user.id, groupId, targetUserId, updateMemberRoleDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'グループからメンバーを削除' })
  @ApiResponse({ status: 200, description: 'メンバーが正常に削除されました' })
  @ApiResponse({ status: 403, description: 'オーナー権限が必要です' })
  @ApiResponse({ status: 404, description: 'ユーザーまたはグループが見つかりません' })
  async removeMember(
    @Request() req,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.removeMember(req.user.id, groupId, targetUserId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'グループから退出' })
  @ApiResponse({ status: 200, description: 'グループから正常に退出しました' })
  @ApiResponse({ status: 404, description: 'グループのメンバーではありません' })
  async leaveGroup(@Request() req, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(req.user.id, groupId);
  }

  @Get(':id/invite')
  @ApiOperation({ summary: '招待コード情報を取得' })
  @ApiResponse({ status: 200, description: '招待コード情報', type: InviteCodeResponseDto })
  @ApiResponse({ status: 403, description: 'グループのメンバーではありません' })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  async getInviteInfo(@Request() req, @Param('id') groupId: string): Promise<InviteCodeResponseDto> {
    return this.groupsService.getInviteInfo(req.user.id, groupId);
  }

  @Post(':id/invite/regenerate')
  @ApiOperation({ summary: '新しい招待コードを生成' })
  @ApiResponse({ status: 201, description: '新しい招待コードが生成されました', type: InviteCodeResponseDto })
  @ApiResponse({ status: 403, description: 'オーナー権限が必要です' })
  @ApiResponse({ status: 404, description: 'グループが見つかりません' })
  async regenerateInviteCode(@Request() req, @Param('id') groupId: string): Promise<InviteCodeResponseDto> {
    return this.groupsService.regenerateInviteCode(req.user.id, groupId);
  }
}