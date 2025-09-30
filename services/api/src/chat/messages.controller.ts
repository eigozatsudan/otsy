import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto, MessageResponseDto, GroupMessagesResponseDto, ItemThreadResponseDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('groups/:groupId')
  @ApiOperation({ summary: 'Send a message to a group or item thread' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  @ApiResponse({ status: 404, description: 'Group or item not found' })
  async sendMessage(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendMessage(req.user.id, groupId, createMessageDto);
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get group messages (general chat)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Messages per page', example: 50 })
  @ApiResponse({ status: 200, description: 'Group messages retrieved', type: GroupMessagesResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async getGroupMessages(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<GroupMessagesResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.getGroupMessages(req.user.id, groupId, pageNum, limitNum);
  }

  @Get('groups/:groupId/items/:itemId/thread')
  @ApiOperation({ summary: 'Get messages for a specific item thread' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Messages per page', example: 50 })
  @ApiResponse({ status: 200, description: 'Item thread messages retrieved', type: ItemThreadResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getItemThread(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('itemId') itemId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ItemThreadResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.getItemThread(req.user.id, groupId, itemId, pageNum, limitNum);
  }

  @Get('groups/:groupId/threads')
  @ApiOperation({ summary: 'Get all item threads with recent activity' })
  @ApiResponse({ status: 200, description: 'Item threads retrieved', type: [ItemThreadResponseDto] })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async getGroupItemThreads(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ): Promise<ItemThreadResponseDto[]> {
    return this.messagesService.getGroupItemThreads(req.user.id, groupId);
  }

  @Get('groups/:groupId/search')
  @ApiOperation({ summary: 'Search messages in a group' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'item_id', required: false, description: 'Search only in specific item thread' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Messages per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Search results', type: GroupMessagesResponseDto })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async searchMessages(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Query('q') query: string,
    @Query('item_id') itemId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<GroupMessagesResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.messagesService.searchMessages(req.user.id, groupId, query, itemId, pageNum, limitNum);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete this message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
  ): Promise<{ success: boolean }> {
    await this.messagesService.deleteMessage(req.user.id, messageId);
    return { success: true };
  }

  @Get('groups/:groupId/stats')
  @ApiOperation({ summary: 'Get message statistics for a group' })
  @ApiResponse({ status: 200, description: 'Message statistics retrieved' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async getGroupMessageStats(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ) {
    return this.messagesService.getGroupMessageStats(req.user.id, groupId);
  }
}