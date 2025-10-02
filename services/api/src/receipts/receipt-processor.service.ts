import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProcessedReceiptData {
  store_name?: string;
  total_amount?: number;
  items: {
    name: string;
    qty: string;
    price: number;
  }[];
  date?: string;
  confidence_score: number;
  raw_text?: string;
}

@Injectable()
export class ReceiptProcessorService {

  constructor(private configService: ConfigService) {
    // Minimal implementation without OpenAI dependency
  }

  async processReceiptImage(imageUrl: string): Promise<ProcessedReceiptData> {
    // Mock processing for development - replace with actual OCR/AI service
    return this.mockReceiptProcessing();
  }

  private mockReceiptProcessing(): ProcessedReceiptData {
    return {
      store_name: 'スーパーマーケット',
      total_amount: 1580,
      items: [
        { name: '牛乳', qty: '1本', price: 298 },
        { name: '食パン', qty: '1斤', price: 158 },
        { name: '卵', qty: '1パック', price: 248 },
        { name: 'りんご', qty: '3個', price: 398 },
        { name: 'にんじん', qty: '2本', price: 178 },
        { name: '豚肉', qty: '300g', price: 498 },
      ],
      date: new Date().toISOString().split('T')[0],
      confidence_score: 0.85,
      raw_text: 'Mock receipt processing - OCR not available',
    };
  }

  async validateReceiptAgainstOrder(
    processedReceipt: ProcessedReceiptData,
    orderItems: any[]
  ): Promise<{
    matches: boolean;
    discrepancies: string[];
    confidence_score: number;
  }> {
    const discrepancies: string[] = [];
    let matchCount = 0;

    // Check if receipt items match order items
    for (const orderItem of orderItems) {
      const receiptItem = processedReceipt.items.find(item => 
        this.itemNamesMatch(item.name, orderItem.name)
      );

      if (!receiptItem) {
        discrepancies.push(`注文商品「${orderItem.name}」がレシートに見つかりません`);
      } else {
        matchCount++;
        
        // Check price range if specified
        if (orderItem.price_min && receiptItem.price < orderItem.price_min) {
          discrepancies.push(`「${orderItem.name}」の価格が予想より安すぎます (¥${receiptItem.price})`);
        }
        if (orderItem.price_max && receiptItem.price > orderItem.price_max) {
          discrepancies.push(`「${orderItem.name}」の価格が予想より高すぎます (¥${receiptItem.price})`);
        }
      }
    }

    // Check for unexpected items
    for (const receiptItem of processedReceipt.items) {
      const orderItem = orderItems.find(item => 
        this.itemNamesMatch(receiptItem.name, item.name)
      );

      if (!orderItem) {
        discrepancies.push(`レシートに注文にない商品「${receiptItem.name}」があります`);
      }
    }

    const matches = discrepancies.length === 0;
    const confidenceScore = matchCount / Math.max(orderItems.length, processedReceipt.items.length);

    return {
      matches,
      discrepancies,
      confidence_score: confidenceScore * processedReceipt.confidence_score,
    };
  }

  private itemNamesMatch(name1: string, name2: string): boolean {
    // Simple fuzzy matching for Japanese item names
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // Partial match (one contains the other)
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Could add more sophisticated matching logic here
    return false;
  }

  async generateReceiptSummary(processedReceipt: ProcessedReceiptData): Promise<string> {
    const itemCount = processedReceipt.items.length;
    const totalAmount = processedReceipt.total_amount || 0;
    const storeName = processedReceipt.store_name || '不明な店舗';

    return `${storeName}で${itemCount}点の商品を購入。合計金額：¥${totalAmount.toLocaleString()}`;
  }
}