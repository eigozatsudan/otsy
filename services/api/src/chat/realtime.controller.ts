import { Controller, Get, Post, Param, Body, Query, Sse, UseGuards, Request, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, interval, map } from 'rxjs';
import { RealtimeService } from './realtime.service';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('realtime')
@Controller('realtime')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RealtimeController {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly messagesService: MessagesService,
  ) {}

  @Sse('groups/:groupId/events')
  @ApiOperation({ summary: 'Subscribe to real-time group events via Server-Sent Events' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  subscribeToGroupEvents(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ): Observable<MessageEvent> {
    // Note: We should verify group membership here, but for SSE we'll do it in the service
    // The JWT guard ensures the user is authenticated
    
    return this.realtimeService.subscribeToGroup(groupId, req.user.id).pipe(
      map(event => ({
        type: event.type,
        data: JSON.stringify({
          ...event.data,
          groupId: event.groupId,
          itemId: event.itemId,
          timestamp: new Date().toISOString()
        })
      }))
    );
  }

  @Sse('groups/:groupId/items/:itemId/events')
  @ApiOperation({ summary: 'Subscribe to real-time item thread events via Server-Sent Events' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  subscribeToItemThreadEvents(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('itemId') itemId: string,
  ): Observable<MessageEvent> {
    return this.realtimeService.subscribeToItemThread(groupId, itemId, req.user.id).pipe(
      map(event => ({
        type: event.type,
        data: JSON.stringify({
          ...event.data,
          groupId: event.groupId,
          itemId: event.itemId,
          timestamp: new Date().toISOString()
        })
      }))
    );
  }

  @Sse('mentions')
  @ApiOperation({ summary: 'Subscribe to mention notifications via Server-Sent Events' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  subscribeToMentions(
    @Request() req: any,
  ): Observable<MessageEvent> {
    return this.realtimeService.subscribeToMentions(req.user.id).pipe(
      map(event => ({
        type: 'mention',
        data: JSON.stringify({
          ...event.data,
          timestamp: new Date().toISOString()
        })
      }))
    );
  }

  @Post('groups/:groupId/typing')
  @ApiOperation({ summary: 'Send typing indicator' })
  @ApiResponse({ status: 200, description: 'Typing indicator sent' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async sendTypingIndicator(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Body() body: { item_id?: string; is_typing: boolean },
  ) {
    // Verify group membership (this will throw if not a member)
    await this.messagesService.getGroupMessages(req.user.id, groupId, 1, 1);

    this.realtimeService.broadcastTyping(
      groupId,
      body.item_id,
      req.user.id,
      req.user.display_name,
      body.is_typing
    );

    return { success: true };
  }

  @Sse('heartbeat')
  @ApiOperation({ summary: 'Heartbeat endpoint to keep SSE connections alive' })
  heartbeat(): Observable<MessageEvent> {
    return interval(30000).pipe( // Send heartbeat every 30 seconds
      map(() => ({
        type: 'heartbeat',
        data: JSON.stringify({ timestamp: new Date().toISOString() })
      }))
    );
  }
}