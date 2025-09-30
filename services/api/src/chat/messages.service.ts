import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, MessageResponseDto, GroupMessagesResponseDto, ItemThreadResponseDto } from './dto/message.dto';
import { RealtimeService } from './realtime.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
  ) {}

  /**
   * Send a message to a group (general chat or item thread)
   */
  async sendMessage(userId: string, groupId: string, createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    // Verify user is a member of the group
    await this.checkGroupMembership(userId, groupId);

    // If item_id is provided, verify the item exists and belongs to the group
    if (createMessageDto.item_id) {
      const item = await this.prisma.item.findUnique({
        where: { id: createMessageDto.item_id },
        select: { group_id: true, name: true }
      });

      if (!item) {
        throw new NotFoundException('Item not found');
      }

      if (item.group_id !== groupId) {
        throw new BadRequestException('Item does not belong to this group');
      }
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        group_id: groupId,
        item_id: createMessageDto.item_id,
        author_id: userId,
        body: createMessageDto.body,
        image_url: createMessageDto.image_url,
      },
      include: {
        author: {
          select: { display_name: true }
        },
        item: {
          select: { name: true }
        }
      }
    });

    const messageResponse = this.formatMessageResponse(message);

    // Broadcast the message to other group members
    this.realtimeService.broadcastMessage(messageResponse, userId);

    // Process @mentions and send notifications
    const mentionedUserIds = await this.processMentions(groupId, createMessageDto.body);
    for (const mentionedUserId of mentionedUserIds) {
      this.realtimeService.broadcastMention(groupId, createMessageDto.item_id, mentionedUserId, messageResponse);
    }

    return messageResponse;
  }

  /**
   * Get group messages (general chat, not item-specific)
   */
  async getGroupMessages(
    userId: string, 
    groupId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<GroupMessagesResponseDto> {
    // Verify user is a member of the group
    await this.checkGroupMembership(userId, groupId);

    const offset = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          group_id: groupId,
          item_id: null, // Only general group messages, not item threads
        },
        include: {
          author: {
            select: { display_name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          group_id: groupId,
          item_id: null,
        }
      })
    ]);

    return {
      messages: messages.reverse().map(msg => this.formatMessageResponse(msg)),
      has_more: offset + limit < total,
      total,
      page,
    };
  }

  /**
   * Get messages for a specific item thread
   */
  async getItemThread(
    userId: string, 
    groupId: string, 
    itemId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ItemThreadResponseDto> {
    // Verify user is a member of the group
    await this.checkGroupMembership(userId, groupId);

    // Verify item exists and belongs to the group
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { group_id: true, name: true }
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.group_id !== groupId) {
      throw new BadRequestException('Item does not belong to this group');
    }

    const offset = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          group_id: groupId,
          item_id: itemId,
        },
        include: {
          author: {
            select: { display_name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          group_id: groupId,
          item_id: itemId,
        }
      })
    ]);

    return {
      item_id: itemId,
      item_name: item.name,
      messages: messages.reverse().map(msg => this.formatMessageResponse(msg)),
      total,
    };
  }

  /**
   * Get all item threads with recent activity for a group
   */
  async getGroupItemThreads(userId: string, groupId: string): Promise<ItemThreadResponseDto[]> {
    // Verify user is a member of the group
    await this.checkGroupMembership(userId, groupId);

    // Get all items in the group that have messages
    const itemsWithMessages = await this.prisma.item.findMany({
      where: {
        group_id: groupId,
        messages: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        messages: {
          include: {
            author: {
              select: { display_name: true }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 5, // Get last 5 messages per item
        }
      },
      orderBy: {
        messages: {
          _count: 'desc' // Order by most active threads first
        }
      }
    });

    return itemsWithMessages.map(item => ({
      item_id: item.id,
      item_name: item.name,
      messages: item.messages.reverse().map(msg => this.formatMessageResponse(msg)),
      total: item.messages.length,
    }));
  }

  /**
   * Search messages in a group
   */
  async searchMessages(
    userId: string, 
    groupId: string, 
    query: string, 
    itemId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GroupMessagesResponseDto> {
    // Verify user is a member of the group
    await this.checkGroupMembership(userId, groupId);

    const offset = (page - 1) * limit;

    const whereClause: any = {
      group_id: groupId,
      body: {
        contains: query,
        mode: 'insensitive'
      }
    };

    // If itemId is provided, search only in that item's thread
    if (itemId) {
      whereClause.item_id = itemId;
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: whereClause,
        include: {
          author: {
            select: { display_name: true }
          },
          item: {
            select: { name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.message.count({
        where: whereClause
      })
    ]);

    return {
      messages: messages.map(msg => this.formatMessageResponse(msg)),
      has_more: offset + limit < total,
      total,
      page,
    };
  }

  /**
   * Delete a message (only by author or group owner)
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        group: {
          select: { created_by: true }
        }
      }
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the author or group creator
    const canDelete = message.author_id === userId || message.group.created_by === userId;

    if (!canDelete) {
      throw new ForbiddenException('You can only delete your own messages or messages in groups you created');
    }

    await this.prisma.message.delete({
      where: { id: messageId }
    });
  }

  /**
   * Get message statistics for a group
   */
  async getGroupMessageStats(userId: string, groupId: string) {
    // Verify user is a member of the group
    await this.checkGroupMembership(userId, groupId);

    const [totalMessages, itemThreads, activeMembers] = await Promise.all([
      this.prisma.message.count({
        where: { group_id: groupId }
      }),
      this.prisma.message.groupBy({
        by: ['item_id'],
        where: {
          group_id: groupId,
          item_id: { not: null }
        },
        _count: { id: true }
      }),
      this.prisma.message.groupBy({
        by: ['author_id'],
        where: { group_id: groupId },
        _count: { id: true }
      })
    ]);

    return {
      total_messages: totalMessages,
      general_messages: totalMessages - itemThreads.reduce((sum, thread) => sum + thread._count.id, 0),
      item_threads: itemThreads.length,
      active_members: activeMembers.length,
      most_active_threads: itemThreads
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 5)
        .map(thread => ({
          item_id: thread.item_id,
          message_count: thread._count.id
        }))
    };
  }

  /**
   * Process @mentions in message content
   */
  async processMentions(groupId: string, messageBody: string): Promise<string[]> {
    // Extract @mentions from message body
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(messageBody)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) {
      return [];
    }

    // Find users in the group whose display names match the mentions
    const groupMembers = await this.prisma.groupMember.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: { id: true, display_name: true }
        }
      }
    });

    const mentionedUserIds = [];
    for (const mention of mentions) {
      const member = groupMembers.find(m => 
        m.user.display_name.toLowerCase() === mention.toLowerCase()
      );
      if (member) {
        mentionedUserIds.push(member.user.id);
      }
    }

    return mentionedUserIds;
  }

  /**
   * Check if user is a member of the group
   */
  private async checkGroupMembership(userId: string, groupId: string): Promise<void> {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: groupId,
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  /**
   * Format message response
   */
  private formatMessageResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      group_id: message.group_id,
      item_id: message.item_id,
      author_id: message.author_id,
      author_name: message.author.display_name,
      body: message.body,
      image_url: message.image_url,
      created_at: message.created_at,
      item_name: message.item?.name,
    };
  }
}