import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReceiptProcessorService } from './receipt-processor.service';
import { 
  SubmitReceiptDto, 
  ReviewReceiptDto, 
  ReceiptStatus,
  GetReceiptUploadUrlDto 
} from './dto/receipt.dto';
import { OrderStatus } from '../orders/dto/order.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private receiptProcessor: ReceiptProcessorService,
  ) {}

  async generateUploadUrl(
    shopperId: string, 
    getUploadUrlDto: GetReceiptUploadUrlDto
  ): Promise<{ upload_url: string; file_url: string }> {
    // Validate order exists and shopper is assigned
    const order = await this.prisma.order.findUnique({
      where: { id: getUploadUrlDto.order_id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.shopper_id !== shopperId) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    if (order.status !== OrderStatus.SHOPPING && order.status !== OrderStatus.AWAIT_RECEIPT_OK) {
      throw new BadRequestException('Order is not in a state that allows receipt submission');
    }

    const folder = `receipts/${getUploadUrlDto.order_id}`;
    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(
      folder, 
      getUploadUrlDto.file_extension
    );

    return {
      upload_url: uploadUrl,
      file_url: fileUrl,
    };
  }

  async submitReceipt(shopperId: string, submitReceiptDto: SubmitReceiptDto) {
    // Validate order and shopper
    const order = await this.prisma.order.findUnique({
      where: { id: submitReceiptDto.order_id },
      include: {
        items: true,
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.shopper_id !== shopperId) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    if (order.status !== OrderStatus.SHOPPING) {
      throw new BadRequestException('Order is not in shopping state');
    }

    // Create receipt record
    const receipt = await this.prisma.$transaction(async (tx) => {
      // Delete any existing receipts for this order
      await tx.receipt.deleteMany({
        where: { order_id: submitReceiptDto.order_id },
      });

      // Create new receipt
      const newReceipt = await tx.receipt.create({
        data: {
          order_id: submitReceiptDto.order_id,
          shopper_id: shopperId,
          image_url: submitReceiptDto.image_url,
          submitted_at: new Date(),
        },
      });

      // Update order status based on receipt check preference
      const newOrderStatus = order.receipt_check === 'required' 
        ? OrderStatus.AWAIT_RECEIPT_OK 
        : OrderStatus.ENROUTE;

      await tx.order.update({
        where: { id: submitReceiptDto.order_id },
        data: { status: newOrderStatus },
      });

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: submitReceiptDto.order_id,
          actor_id: shopperId,
          actor_role: 'shopper',
          action: 'receipt_submitted',
          payload: {
            receipt_id: newReceipt.id,
            image_url: submitReceiptDto.image_url,
            total_amount: submitReceiptDto.total_amount,
            store_name: submitReceiptDto.store_name,
            items_count: submitReceiptDto.items?.length || 0,
            receipt_check: order.receipt_check,
            new_status: newOrderStatus,
          },
        },
      });

      return newReceipt;
    });

    return this.findOne(receipt.id);
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
            user: {
              select: { id: true, email: true },
            },
            shopper: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }

  async findByOrderId(orderId: string) {
    return this.prisma.receipt.findMany({
      where: { order_id: orderId },
      orderBy: { submitted_at: 'desc' },
      include: {
        shopper: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async reviewReceipt(
    reviewerId: string, 
    receiptId: string, 
    reviewReceiptDto: ReviewReceiptDto
  ) {
    const receipt = await this.findOne(receiptId);
    
    // Validate receipt is in reviewable state
    if (receipt.order.status !== OrderStatus.AWAIT_RECEIPT_OK) {
      throw new BadRequestException('Receipt is not awaiting review');
    }

    // Update receipt and order status
    const updatedReceipt = await this.prisma.$transaction(async (tx) => {
      // Update receipt with review
      const updated = await tx.receipt.update({
        where: { id: receiptId },
        data: {
          // Note: We'd need to add these fields to the Receipt model
          // For now, we'll store review info in audit logs
        },
      });

      // Update order status based on review
      let newOrderStatus: OrderStatus;
      if (reviewReceiptDto.status === ReceiptStatus.APPROVED) {
        newOrderStatus = OrderStatus.ENROUTE;
      } else if (reviewReceiptDto.status === ReceiptStatus.REJECTED) {
        newOrderStatus = OrderStatus.SHOPPING; // Back to shopping
      } else {
        newOrderStatus = OrderStatus.AWAIT_RECEIPT_OK; // Keep waiting
      }

      await tx.order.update({
        where: { id: receipt.order_id },
        data: { status: newOrderStatus },
      });

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: receipt.order_id,
          actor_id: reviewerId,
          actor_role: 'user', // Assuming user is reviewing
          action: 'receipt_reviewed',
          payload: {
            receipt_id: receiptId,
            review_status: reviewReceiptDto.status,
            review_notes: reviewReceiptDto.review_notes,
            corrected_items: reviewReceiptDto.corrected_items,
            corrected_total: reviewReceiptDto.corrected_total,
            old_order_status: receipt.order.status,
            new_order_status: newOrderStatus,
          },
        },
      });

      return updated;
    });

    return this.findOne(updatedReceipt.id);
  }

  async getPendingReceipts() {
    return this.prisma.receipt.findMany({
      where: {
        order: {
          status: OrderStatus.AWAIT_RECEIPT_OK,
        },
      },
      include: {
        order: {
          include: {
            items: true,
            user: {
              select: { id: true, email: true },
            },
            shopper: {
              select: { id: true, email: true },
            },
          },
        },
      },
      orderBy: { submitted_at: 'asc' }, // Oldest first
    });
  }

  async getReceiptsByUser(userId: string) {
    return this.prisma.receipt.findMany({
      where: {
        order: {
          user_id: userId,
        },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
        shopper: {
          select: { id: true, email: true },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });
  }

  async getReceiptsByShopper(shopperId: string) {
    return this.prisma.receipt.findMany({
      where: { shopper_id: shopperId },
      include: {
        order: {
          include: {
            items: true,
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });
  }

  async generateSignedViewUrl(receiptId: string, userId: string, userRole: string) {
    const receipt = await this.findOne(receiptId);
    
    // Check permissions
    const canView = 
      userRole === 'admin' ||
      (userRole === 'user' && receipt.order.user_id === userId) ||
      (userRole === 'shopper' && receipt.shopper_id === userId);

    if (!canView) {
      throw new ForbiddenException('Not authorized to view this receipt');
    }

    // Extract key from URL
    const urlParts = receipt.image_url.split('/');
    const key = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)

    return this.storageService.generateDownloadUrl(key);
  }

  async deleteReceipt(receiptId: string, actorId: string, actorRole: string) {
    const receipt = await this.findOne(receiptId);
    
    // Check permissions
    const canDelete = 
      actorRole === 'admin' ||
      (actorRole === 'shopper' && receipt.shopper_id === actorId && 
       receipt.order.status === OrderStatus.SHOPPING);

    if (!canDelete) {
      throw new ForbiddenException('Not authorized to delete this receipt');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete receipt
      await tx.receipt.delete({
        where: { id: receiptId },
      });

      // Update order status back to shopping if needed
      if (receipt.order.status === OrderStatus.AWAIT_RECEIPT_OK) {
        await tx.order.update({
          where: { id: receipt.order_id },
          data: { status: OrderStatus.SHOPPING },
        });
      }

      // Create audit log
      await tx.orderAuditLog.create({
        data: {
          order_id: receipt.order_id,
          actor_id: actorId,
          actor_role: actorRole,
          action: 'receipt_deleted',
          payload: {
            receipt_id: receiptId,
            reason: 'Receipt deleted by ' + actorRole,
          },
        },
      });
    });

    return { message: 'Receipt deleted successfully' };
  }

  async processReceiptImage(receiptId: string, actorId: string, actorRole: string) {
    const receipt = await this.findOne(receiptId);
    
    // Check permissions
    const canProcess = 
      actorRole === 'admin' ||
      (actorRole === 'user' && receipt.order.user_id === actorId) ||
      (actorRole === 'shopper' && receipt.shopper_id === actorId);

    if (!canProcess) {
      throw new ForbiddenException('Not authorized to process this receipt');
    }

    try {
      // Process the receipt image
      const processedData = await this.receiptProcessor.processReceiptImage(receipt.image_url);
      
      // Validate against order items
      const validation = await this.receiptProcessor.validateReceiptAgainstOrder(
        processedData,
        receipt.order.items
      );

      // Generate summary
      const summary = await this.receiptProcessor.generateReceiptSummary(processedData);

      // Create audit log with processing results
      await this.prisma.orderAuditLog.create({
        data: {
          order_id: receipt.order_id,
          actor_id: actorId,
          actor_role: actorRole,
          action: 'receipt_processed',
          payload: {
            receipt_id: receiptId,
            processed_data: processedData,
            validation_results: validation,
            summary,
          },
        },
      });

      return {
        processed_data: processedData,
        validation: validation,
        summary,
        recommendations: this.generateRecommendations(validation, processedData),
      };
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw new BadRequestException('Failed to process receipt image');
    }
  }

  private generateRecommendations(
    validation: any,
    processedData: any
  ): string[] {
    const recommendations: string[] = [];

    if (!validation.matches) {
      recommendations.push('レシートと注文内容に相違があります。確認が必要です。');
    }

    if (validation.confidence_score < 0.7) {
      recommendations.push('OCR認識の信頼度が低いです。手動確認をお勧めします。');
    }

    if (processedData.items.length === 0) {
      recommendations.push('商品が認識されませんでした。画像を再撮影してください。');
    }

    if (!processedData.total_amount) {
      recommendations.push('合計金額が認識されませんでした。手動で入力してください。');
    }

    if (recommendations.length === 0) {
      recommendations.push('レシートは正常に処理されました。');
    }

    return recommendations;
  }

  async getReceiptStats() {
    const [
      totalReceipts,
      pendingReceipts,
      approvedReceipts,
      rejectedReceipts,
    ] = await Promise.all([
      this.prisma.receipt.count(),
      this.prisma.receipt.count({
        where: {
          order: { status: OrderStatus.AWAIT_RECEIPT_OK },
        },
      }),
      this.prisma.orderAuditLog.count({
        where: {
          action: 'receipt_reviewed',
          payload: {
            path: ['review_status'],
            equals: ReceiptStatus.APPROVED,
          },
        },
      }),
      this.prisma.orderAuditLog.count({
        where: {
          action: 'receipt_reviewed',
          payload: {
            path: ['review_status'],
            equals: ReceiptStatus.REJECTED,
          },
        },
      }),
    ]);

    return {
      total_receipts: totalReceipts,
      pending_review: pendingReceipts,
      approved: approvedReceipts,
      rejected: rejectedReceipts,
      approval_rate: totalReceipts > 0 ? (approvedReceipts / totalReceipts) * 100 : 0,
    };
  }
}