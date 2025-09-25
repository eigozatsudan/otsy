import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreatePaymentIntentDto, 
  AuthorizePaymentDto, 
  CapturePaymentDto, 
  RefundPaymentDto,
  PaymentStatus 
} from './dto/payment.dto';
import { OrderStatus } from '../orders/dto/order.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(userId: string, createPaymentDto: CreatePaymentIntentDto) {
    // Validate order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: createPaymentDto.order_id },
      include: {
        user: { select: { id: true, email: true } },
        payments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('Not authorized to create payment for this order');
    }

    // Check if order is in correct state for payment
    if (![OrderStatus.NEW, OrderStatus.ACCEPTED].includes(order.status as OrderStatus)) {
      throw new BadRequestException('Order is not in a state that allows payment creation');
    }

    // Check if payment already exists
    if (order.payments.length > 0 && order.payments[0].status !== PaymentStatus.FAILED) {
      throw new BadRequestException('Payment already exists for this order');
    }

    try {
      // Create Stripe PaymentIntent with manual capture
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: createPaymentDto.amount,
        currency: 'jpy',
        capture_method: 'manual', // Manual capture for authorization/capture flow
        payment_method: createPaymentDto.payment_method_id,
        customer: createPaymentDto.customer_id,
        metadata: {
          order_id: createPaymentDto.order_id,
          user_id: userId,
        },
        description: `Otsukai DX Order ${createPaymentDto.order_id}`,
      });

      // Create payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          order_id: createPaymentDto.order_id,
          stripe_pi: paymentIntent.id,
          status: PaymentStatus.PENDING,
          amount: createPaymentDto.amount,
        },
      });

      // Create audit log
      await this.prisma.orderAuditLog.create({
        data: {
          order_id: createPaymentDto.order_id,
          actor_id: userId,
          actor_role: 'user',
          action: 'payment_intent_created',
          payload: {
            payment_id: payment.id,
            stripe_pi: paymentIntent.id,
            amount: createPaymentDto.amount,
            status: paymentIntent.status,
          },
        },
      });

      return {
        ...payment,
        client_secret: paymentIntent.client_secret,
        currency: 'jpy',
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async authorizePayment(userId: string, authorizePaymentDto: AuthorizePaymentDto) {
    // Get order and validate
    const order = await this.prisma.order.findUnique({
      where: { id: authorizePaymentDto.order_id },
      include: {
        payments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('Not authorized to authorize payment for this order');
    }

    if (order.payments.length === 0) {
      throw new BadRequestException('No payment intent found for this order');
    }

    const payment = order.payments[0];

    try {
      // Confirm the PaymentIntent to authorize payment
      const paymentIntent = await this.stripe.paymentIntents.confirm(payment.stripe_pi, {
        payment_method: authorizePaymentDto.payment_method_id,
      });

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentIntent.status === 'requires_capture' 
            ? PaymentStatus.AUTHORIZED 
            : PaymentStatus.FAILED,
        },
      });

      // Update order with authorized amount
      await this.prisma.order.update({
        where: { id: authorizePaymentDto.order_id },
        data: { auth_amount: payment.amount },
      });

      // Create audit log
      await this.prisma.orderAuditLog.create({
        data: {
          order_id: authorizePaymentDto.order_id,
          actor_id: userId,
          actor_role: 'user',
          action: 'payment_authorized',
          payload: {
            payment_id: payment.id,
            stripe_pi: payment.stripe_pi,
            amount: payment.amount,
            stripe_status: paymentIntent.status,
          },
        },
      });

      return updatedPayment;
    } catch (error) {
      console.error('Error authorizing payment:', error);
      
      // Update payment status to failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      throw new BadRequestException('Failed to authorize payment');
    }
  }

  async capturePayment(actorId: string, actorRole: string, capturePaymentDto: CapturePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: capturePaymentDto.payment_id },
      include: {
        order: {
          include: {
            user: { select: { id: true } },
            shopper: { select: { id: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check permissions
    const canCapture = 
      actorRole === 'admin' ||
      (actorRole === 'user' && payment.order.user_id === actorId) ||
      (actorRole === 'system'); // For automatic capture

    if (!canCapture) {
      throw new ForbiddenException('Not authorized to capture this payment');
    }

    if (payment.status !== PaymentStatus.AUTHORIZED) {
      throw new BadRequestException('Payment is not in authorized state');
    }

    try {
      // Capture the payment on Stripe
      const captureAmount = capturePaymentDto.amount || payment.amount;
      const paymentIntent = await this.stripe.paymentIntents.capture(payment.stripe_pi, {
        amount_to_capture: captureAmount,
      });

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          // Note: We'd need to add captured_amount field to the Payment model
        },
      });

      // Create audit log
      await this.prisma.orderAuditLog.create({
        data: {
          order_id: payment.order_id,
          actor_id: actorId,
          actor_role: actorRole,
          action: 'payment_captured',
          payload: {
            payment_id: payment.id,
            stripe_pi: payment.stripe_pi,
            captured_amount: captureAmount,
            reason: capturePaymentDto.reason,
            stripe_status: paymentIntent.status,
          },
        },
      });

      return updatedPayment;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw new BadRequestException('Failed to capture payment');
    }
  }

  async refundPayment(actorId: string, actorRole: string, refundPaymentDto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: refundPaymentDto.payment_id },
      include: {
        order: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check permissions (only admin can process refunds)
    if (actorRole !== 'admin') {
      throw new ForbiddenException('Only administrators can process refunds');
    }

    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Payment is not in captured state');
    }

    try {
      // Create refund on Stripe
      const refundAmount = refundPaymentDto.amount || payment.amount;
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripe_pi,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          order_id: payment.order_id,
          admin_id: actorId,
          reason: refundPaymentDto.reason || 'Admin refund',
        },
      });

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.CAPTURED,
          // Note: We'd need to add refunded_amount field to the Payment model
        },
      });

      // Create audit log
      await this.prisma.orderAuditLog.create({
        data: {
          order_id: payment.order_id,
          actor_id: actorId,
          actor_role: actorRole,
          action: 'payment_refunded',
          payload: {
            payment_id: payment.id,
            stripe_pi: payment.stripe_pi,
            refund_id: refund.id,
            refunded_amount: refundAmount,
            reason: refundPaymentDto.reason,
          },
        },
      });

      return {
        payment: updatedPayment,
        refund: {
          id: refund.id,
          amount: refundAmount,
          status: refund.status,
        },
      };
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw new BadRequestException('Failed to process refund');
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    console.log('Processing webhook event:', event.type);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw new BadRequestException('Failed to process webhook');
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripe_pi: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status based on PaymentIntent status
    let status: PaymentStatus;
    if (paymentIntent.status === 'requires_capture') {
      status = PaymentStatus.AUTHORIZED;
    } else if (paymentIntent.status === 'succeeded') {
      status = PaymentStatus.CAPTURED;
    } else {
      status = PaymentStatus.PENDING;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    // Create audit log
    await this.prisma.orderAuditLog.create({
      data: {
        order_id: payment.order_id,
        actor_id: 'system',
        actor_role: 'system',
        action: 'webhook_payment_succeeded',
        payload: {
          payment_id: payment.id,
          stripe_pi: paymentIntent.id,
          stripe_status: paymentIntent.status,
          amount: paymentIntent.amount,
        },
      },
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripe_pi: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    // Create audit log
    await this.prisma.orderAuditLog.create({
      data: {
        order_id: payment.order_id,
        actor_id: 'system',
        actor_role: 'system',
        action: 'webhook_payment_failed',
        payload: {
          payment_id: payment.id,
          stripe_pi: paymentIntent.id,
          last_payment_error: paymentIntent.last_payment_error,
        },
      },
    });
  }

  private async handleChargeDispute(dispute: Stripe.Dispute) {
    // Handle charge disputes
    console.log('Charge dispute created:', dispute.id);
    
    // Create audit log for dispute
    await this.prisma.orderAuditLog.create({
      data: {
        order_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        actor_id: 'system',
        actor_role: 'system',
        action: 'charge_dispute_created',
        payload: {
          dispute_id: dispute.id,
          charge_id: dispute.charge,
          amount: dispute.amount,
          reason: dispute.reason,
          status: dispute.status,
        },
      },
    });
  }

  async getPaymentsByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPaymentById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: { select: { id: true, email: true } },
            shopper: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentStats() {
    const [
      totalPayments,
      authorizedPayments,
      capturedPayments,
      refundedPayments,
      failedPayments,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: PaymentStatus.AUTHORIZED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.CAPTURED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    ]);

    const totalAmount = await this.prisma.payment.aggregate({
      where: { status: PaymentStatus.CAPTURED },
      _sum: { amount: true },
    });

    return {
      total_payments: totalPayments,
      authorized: authorizedPayments,
      captured: capturedPayments,
      refunded: refundedPayments,
      failed: failedPayments,
      total_revenue: totalAmount._sum.amount || 0,
      success_rate: totalPayments > 0 ? (capturedPayments / totalPayments) * 100 : 0,
    };
  }
}