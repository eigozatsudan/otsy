import { Injectable, NotFoundException } from '@nestjs/common';

export interface LlmItem {
  name: string;
  qty: number;
  price_min: number;
  price_max: number;
  allow_subs: boolean;
  notes?: string;
  alternatives: string[];
}

export interface LlmSession {
  id: string;
  current_items: LlmItem[];
  created_at: Date;
}

export interface LlmConversationContext {
  session_id: string;
  user_input: string;
  previous_items: LlmItem[];
}

export interface GenerateShoppingListOptions {
  input: string;
  existing_items?: string[];
  dietary_restrictions?: string[];
  budget_level?: number;
}

export interface GenerateShoppingListResponse {
  session_id: string;
  items: LlmItem[];
  confidence_score: number;
}

@Injectable()
export class LlmService {
  private sessions = new Map<string, LlmSession>();
  private contexts = new Map<string, LlmConversationContext>();

  getSession(sessionId: string): LlmSession | null {
    return this.sessions.get(sessionId) || null;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.contexts.delete(sessionId);
  }

  async getConversationContext(sessionId: string): Promise<LlmConversationContext | null> {
    return this.contexts.get(sessionId) || null;
  }

  async generateShoppingList(options: GenerateShoppingListOptions): Promise<GenerateShoppingListResponse> {
    // This is a minimal implementation - in a real app, this would call an LLM API
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse basic items from input (very simple implementation)
    const items = this.parseItemsFromInput(options.input);
    
    // Create session
    const session: LlmSession = {
      id: sessionId,
      current_items: items,
      created_at: new Date(),
    };
    
    // Create context
    const context: LlmConversationContext = {
      session_id: sessionId,
      user_input: options.input,
      previous_items: items,
    };
    
    this.sessions.set(sessionId, session);
    this.contexts.set(sessionId, context);
    
    return {
      session_id: sessionId,
      items,
      confidence_score: 0.8,
    };
  }

  private parseItemsFromInput(input: string): LlmItem[] {
    // Very basic parsing - in a real implementation, this would use LLM
    const commonItems = [
      'milk', 'bread', 'eggs', 'rice', 'chicken', 'beef', 'pork', 'fish',
      'tomatoes', 'onions', 'carrots', 'potatoes', 'apples', 'bananas',
      'cheese', 'butter', 'yogurt', 'pasta', 'noodles', 'soy sauce'
    ];
    
    const foundItems: LlmItem[] = [];
    const lowerInput = input.toLowerCase();
    
    commonItems.forEach(item => {
      if (lowerInput.includes(item)) {
        foundItems.push({
          name: item,
          qty: 1,
          price_min: 100,
          price_max: 500,
          allow_subs: true,
          alternatives: [],
        });
      }
    });
    
    // If no items found, add a generic item
    if (foundItems.length === 0) {
      foundItems.push({
        name: 'grocery items',
        qty: 1,
        price_min: 300,
        price_max: 1000,
        allow_subs: true,
        notes: `Based on: ${input}`,
        alternatives: [],
      });
    }
    
    return foundItems;
  }
}