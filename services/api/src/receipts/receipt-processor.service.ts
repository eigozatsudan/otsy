import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async processReceiptImage(imageUrl: string): Promise<ProcessedReceiptData> {
    if (!this.openai) {
      // Mock processing for development
      return this.mockReceiptProcessing();
    }

    try {
      // Use GPT-4o mini with vision to analyze receipt
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing Japanese grocery store receipts. 
Extract the following information from the receipt image:
- Store name
- Individual items with names, quantities, and prices
- Total amount
- Date (if visible)

Respond in JSON format:
{
  "store_name": "店舗名",
  "total_amount": 総額,
  "items": [
    {
      "name": "商品名",
      "qty": "数量",
      "price": 価格
    }
  ],
  "date": "YYYY-MM-DD",
  "confidence_score": 0.0-1.0,
  "raw_text": "認識したテキスト全体"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this Japanese grocery receipt and extract the information in the specified JSON format.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision');
      }

      return this.parseReceiptResponse(content);
    } catch (error) {
      console.error('Error processing receipt image:', error);
      throw new BadRequestException('Failed to process receipt image');
    }
  }

  private parseReceiptResponse(response: string): ProcessedReceiptData {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        store_name: parsed.store_name,
        total_amount: parsed.total_amount,
        items: parsed.items || [],
        date: parsed.date,
        confidence_score: parsed.confidence_score || 0.7,
        raw_text: parsed.raw_text,
      };
    } catch (error) {
      console.error('Failed to parse receipt response:', error);
      // Return mock data if parsing fails
      return this.mockReceiptProcessing();
    }
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