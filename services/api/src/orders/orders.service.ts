import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { 
  CreateOrderDto, 
  UpdateOrderStatusDto, 
  AcceptOrderDto, 
  OrderApprovalDto, 
  OrderFilterDto,
  OrderStatus,
  OrderMode,
  ReceiptCheck
} from './dto/order.dto';
import { CreateOrderFromLlmDto, VoiceToOrderDto } from './dto/llm-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    console.log('Creating order for user ID:', userId);
    
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('User not found:', userId);
      throw new NotFoundException('User not found');
    }
    
    console.log('User found:', { id: user.id, email: user.email });

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          mode: createOrderDto.mode,
          receipt_check: createOrderDto.receipt_check,
          estimate_amount: createOrderDto.estimate_amount,
          deadline_ts: createOrderDto.deadline_ts ? new Date(createOrderDto.deadline_ts) : null,
          priority: createOrderDto.priority,
          address_json: createOrderDto.address_json as any,
          status: OrderStatus.NEW,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: createOrderDto.items.map(item => ({
          order_id: newOrder.id,
          name: item.name,
          qty: item.qty,
          price_min: item.price_min,
          price_max: item.price_max,
          allow_subs: item.allow_subs ?? true,
          notes: item.note,
        })),
      });

      // Create audit log (temporarily disabled for debugging)
      console.log('Skipping audit log creation for debugging');
      // try {
      //   await tx.orderAuditLog.create({
      //     data: {
      //       order_id: newOrder.id,
      //       actor_id: userId,
      //       actor_role: 'user',
      //       action: 'order_created',
      //       payload: {
      //         mode: createOrderDto.mode,
      //         receipt_check: createOrderDto.receipt_check,
      //         estimate_amount: createOrderDto.estimate_amount,
      //         items_count: createOrderDto.items.length,
      //       },
      //     },
      //   });
      // } catch (auditError) {
      //   // Log the error but don't fail the order creation
      //   console.warn('Failed to create audit log:', auditError);
      // }

      return newOrder;
    });

    return this.findOne(order.id);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            subscription_tier: true,
          },
        },
        shopper: {
          select: {
            id: true,
            email: true,
            phone: true,
            rating_avg: true,
            rating_count: true,
          },
        },
        receipts: {
          orderBy: { submitted_at: 'desc' },
          take: 1,
        },
        payments: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findMany(filterDto: OrderFilterDto) {
    const { status, user_id, shopper_id, page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (shopper_id) where.shopper_id = shopper_id;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
          shopper: {
            select: {
              id: true,
              email: true,
              phone: true,
              rating_avg: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async acceptOrder(shopperId: string, orderId: string, acceptOrderDto: AcceptOrderDto) {
    // Validate shopper can accept orders
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    if (shopper.status !== 'active' || shopper.kyc_status !== 'approved') {
      throw new ForbiddenException('Shopper not eligible to accept orders');
    }

    // Get order and validate it can be accepted
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Order cannot be accepted in current status');
    }

    if (order.shopper_id) {
      throw new BadRequestException('Order already has a shopper assigned');
    }

    // Update order status and assign shopper
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          shopper_id: shopperId,
          status: OrderStatus.ACCEPTED,
        },
      });

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: orderId,
          actor_id: shopperId,
          actor_role: 'shopper',
          action: 'order_accepted',
          payload: {
            note: acceptOrderDto.note,
            estimated_completion: acceptOrderDto.estimated_completion,
          },
        },
      });

      return updated;
    });

    return this.findOne(updatedOrder.id);
  }

  async updateStatus(
    actorId: string, 
    actorRole: 'user' | 'shopper' | 'admin',
    orderId: string, 
    updateStatusDto: UpdateOrderStatusDto
  ) {
    const order = await this.findOne(orderId);

    // Validate permissions
    if (actorRole === 'user' && order.user_id !== actorId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    if (actorRole === 'shopper' && order.shopper_id !== actorId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    // Validate status transition
    this.validateStatusTransition(order.status as OrderStatus, updateStatusDto.status as unknown as OrderStatus, actorRole);

    // Update order status
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: updateStatusDto.status,
        },
      });

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: orderId,
          actor_id: actorId,
          actor_role: actorRole,
          action: 'status_updated',
          payload: {
            old_status: order.status,
            new_status: updateStatusDto.status,
            note: updateStatusDto.notes,
          },
        },
      });

      return updated;
    });

    return this.findOne(updatedOrder.id);
  }

  async approveReceipt(userId: string, orderId: string, approvalDto: OrderApprovalDto) {
    const order = await this.findOne(orderId);

    // Validate permissions
    if (order.user_id !== userId) {
      throw new ForbiddenException('Not authorized to approve this order');
    }

    // Validate order status
    if (order.status !== OrderStatus.AWAIT_RECEIPT_OK) {
      throw new BadRequestException('Order is not awaiting receipt approval');
    }

    const newStatus = approvalDto.decision === 'ok' ? OrderStatus.ENROUTE : OrderStatus.SHOPPING;

    // Update order status
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
        },
      });

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: orderId,
          actor_id: userId,
          actor_role: 'user',
          action: 'receipt_approved',
          payload: {
            decision: approvalDto.decision,
            reason: approvalDto.reason,
            old_status: order.status,
            new_status: newStatus,
          },
        },
      });

      return updated;
    });

    return this.findOne(updatedOrder.id);
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.findOne(orderId);

    // Validate permissions
    if (order.user_id !== userId) {
      throw new ForbiddenException('Not authorized to cancel this order');
    }

    // Validate order can be cancelled
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status as OrderStatus)) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    // Update order status
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: orderId,
          actor_id: userId,
          actor_role: 'user',
          action: 'order_cancelled',
          payload: {
            reason,
            old_status: order.status,
          },
        },
      });

      return updated;
    });

    return this.findOne(updatedOrder.id);
  }

  async getAvailableOrders(shopperId: string, filterDto: Partial<OrderFilterDto> = {}) {
    // Check if shopper can accept orders
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
    });

    if (!shopper || shopper.status !== 'active' || shopper.kyc_status !== 'approved') {
      return { orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }

    // Get available orders (new status, no shopper assigned)
    const { page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const where = {
      status: OrderStatus.NEW,
      shopper_id: null,
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              email: true,
              subscription_tier: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderHistory(userId: string, filterDto: Partial<OrderFilterDto> = {}) {
    const { page = 1, limit = 20, status } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          shopper: {
            select: {
              id: true,
              email: true,
              rating_avg: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createFromLlmSession(userId: string, sessionId: string, orderOptions: {
    mode: OrderMode;
    receipt_check: ReceiptCheck;
    address_json: any;
    deadline_ts?: string;
    priority?: number;
  }) {
    // Get LLM session
    const session = this.llmService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Shopping session not found');
    }

    // Convert LLM items to order items
    const items = session.current_items.map(item => ({
      name: item.name,
      qty: item.qty,
      price_min: item.price_min,
      price_max: item.price_max,
      allow_subs: item.allow_subs || false,
      note: item.notes,
    }));

    // Calculate estimate amount
    const estimate_amount = session.current_items.reduce(
      (sum, item) => sum + (item.price_max || item.price_min || 300), 
      0
    );

    const createOrderDto: CreateOrderDto = {
      mode: orderOptions.mode,
      receipt_check: orderOptions.receipt_check,
      estimate_amount,
      address_json: orderOptions.address_json,
      deadline_ts: orderOptions.deadline_ts,
      priority: orderOptions.priority,
      items,
    };

    // Create the order
    const order = await this.create(userId, createOrderDto);

    // Clear the LLM session after successful order creation
    this.llmService.clearSession(sessionId);

    return order;
  }

  async createOrderFromLlm(userId: string, createFromLlmDto: CreateOrderFromLlmDto) {
    // Get LLM session context
    const context = await this.llmService.getConversationContext(createFromLlmDto.session_id);
    if (!context) {
      throw new NotFoundException('LLM session not found or expired');
    }

    // Filter items if specific items are selected
    let itemsToOrder = context.previous_items;
    if (createFromLlmDto.selected_item_names && createFromLlmDto.selected_item_names.length > 0) {
      itemsToOrder = context.previous_items.filter(item => 
        createFromLlmDto.selected_item_names!.includes(item.name)
      );
    }

    if (itemsToOrder.length === 0) {
      throw new BadRequestException('No items selected for order');
    }

    // Calculate total estimate
    const estimateAmount = itemsToOrder.reduce((total, item) => 
      total + ((item.price_min + item.price_max) / 2), 0
    );

    // Convert LLM items to order items
    const orderItems = itemsToOrder.map(item => ({
      name: item.name,
      qty: item.qty,
      price_min: item.price_min,
      price_max: item.price_max,
      allow_subs: item.alternatives.length > 0,
      note: item.notes || `Alternatives: ${item.alternatives.join(', ')}`,
    }));

    // Create order DTO
    const createOrderDto: CreateOrderDto = {
      mode: createFromLlmDto.mode,
      receipt_check: createFromLlmDto.receipt_check,
      estimate_amount: Math.round(estimateAmount),
      deadline_ts: createFromLlmDto.deadline_ts,
      priority: createFromLlmDto.priority,
      address_json: createFromLlmDto.address_json,
      items: orderItems,
    };

    // Create the order
    const order = await this.create(userId, createOrderDto);

    // Clear the LLM session after successful order creation
    this.llmService.clearSession(createFromLlmDto.session_id);

    return {
      ...order,
      llm_metadata: {
        original_input: context.user_input,
        confidence_score: 0.8, // Could be stored from LLM response
        items_generated: context.previous_items.length,
        items_ordered: itemsToOrder.length,
      },
    };
  }

  async createOrderFromVoice(userId: string, voiceToOrderDto: VoiceToOrderDto) {
    // Generate shopping list from voice input
    const llmResponse = await this.llmService.generateShoppingList({
      input: voiceToOrderDto.voice_input,
      existing_items: voiceToOrderDto.existing_items,
      dietary_restrictions: voiceToOrderDto.dietary_restrictions,
      budget_level: voiceToOrderDto.budget_level,
    });

    // Create order from LLM response
    const createFromLlmDto: CreateOrderFromLlmDto = {
      session_id: llmResponse.session_id,
      mode: voiceToOrderDto.mode,
      receipt_check: voiceToOrderDto.receipt_check,
      deadline_ts: voiceToOrderDto.deadline_ts,
      priority: voiceToOrderDto.priority,
      address_json: voiceToOrderDto.address_json,
    };

    return this.createOrderFromLlm(userId, createFromLlmDto);
  }

  async generateShoppingListPreview(userId: string, input: string, options?: {
    existing_items?: string[];
    dietary_restrictions?: string[];
    budget_level?: number;
  }) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate shopping list without creating an order
    return this.llmService.generateShoppingList({
      input,
      existing_items: options?.existing_items,
      dietary_restrictions: options?.dietary_restrictions,
      budget_level: options?.budget_level,
    });
  }

  private validateStatusTransition(
    currentStatus: OrderStatus, 
    newStatus: OrderStatus, 
    actorRole: 'user' | 'shopper' | 'admin'
  ) {
    const validTransitions: Record<OrderStatus, { [key in 'user' | 'shopper' | 'admin']?: OrderStatus[] }> = {
      [OrderStatus.NEW]: {
        user: [OrderStatus.CANCELLED],
        admin: [OrderStatus.CANCELLED],
      },
      [OrderStatus.ACCEPTED]: {
        shopper: [OrderStatus.SHOPPING],
        user: [OrderStatus.CANCELLED],
        admin: [OrderStatus.CANCELLED, OrderStatus.SHOPPING],
      },
      [OrderStatus.SHOPPING]: {
        shopper: [OrderStatus.AWAIT_RECEIPT_OK],
        user: [OrderStatus.CANCELLED],
        admin: [OrderStatus.CANCELLED, OrderStatus.AWAIT_RECEIPT_OK],
      },
      [OrderStatus.AWAIT_RECEIPT_OK]: {
        user: [OrderStatus.ENROUTE, OrderStatus.SHOPPING], // Approve or reject receipt
        admin: [OrderStatus.ENROUTE, OrderStatus.SHOPPING, OrderStatus.CANCELLED],
      },
      [OrderStatus.ENROUTE]: {
        shopper: [OrderStatus.DELIVERED],
        admin: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      },
      [OrderStatus.DELIVERED]: {
        admin: [OrderStatus.CANCELLED], // Only for refunds/disputes
      },
      [OrderStatus.CANCELLED]: {
        // No transitions from cancelled
      },
    };

    const allowedTransitions = validTransitions[currentStatus]?.[actorRole] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus} for ${actorRole}`
      );
    }
  }
}