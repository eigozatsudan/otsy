import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ShoppingItem {
  name: string;
  qty: string;
  price_min: number;
  price_max: number;
  alternatives: string[];
  notes?: string;
  allow_subs?: boolean;
}

export interface ConversationTurn {
  user_input: string;
  assistant_response: string;
  items_generated: ShoppingItem[];
  timestamp: Date;
}

export interface LlmSession {
  session_id: string;
  user_input: string;
  current_items: ShoppingItem[];
  previous_items: ShoppingItem[];
  confidence_score: number;
  conversation_history: ConversationTurn[];
  created_at: Date;
  updated_at: Date;
}

export interface GenerateShoppingListRequest {
  input: string;
  existing_items?: string[];
  dietary_restrictions?: string[];
  budget_level?: number;
}

export interface GenerateShoppingListResponse {
  session_id: string;
  items: ShoppingItem[];
  confidence_score: number;
  suggestions: string[];
  total_estimate: number;
}

@Injectable()
export class LlmService {
  private sessions = new Map<string, LlmSession>();
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
    }
  }

  async generateShoppingList(request: GenerateShoppingListRequest): Promise<GenerateShoppingListResponse> {
    const sessionId = this.generateSessionId();
    
    try {
      let items: ShoppingItem[];
      let confidenceScore: number;
      let suggestions: string[];

      if (this.openai) {
        // Use OpenAI GPT-4o mini API for efficient and accurate processing
        const result = await this.callOpenAI(request);
        items = result.items;
        confidenceScore = result.confidence_score;
        suggestions = result.suggestions;
      } else {
        // Fallback to mock implementation
        console.warn('OpenAI API key not configured, using mock implementation');
        const mockResult = this.parseMockInput(request.input);
        items = mockResult;
        confidenceScore = 0.85;
        suggestions = [
          'Consider adding vegetables for a balanced meal',
          'Check if you have cooking oil at home',
        ];
      }

      const session: LlmSession = {
        session_id: sessionId,
        user_input: request.input,
        current_items: items,
        previous_items: items,
        confidence_score: confidenceScore,
        conversation_history: [{
          user_input: request.input,
          assistant_response: `Generated ${items.length} items with ${Math.round(confidenceScore * 100)}% confidence`,
          items_generated: items,
          timestamp: new Date(),
        }],
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.sessions.set(sessionId, session);

      const totalEstimate = items.reduce(
        (sum, item) => sum + ((item.price_min + item.price_max) / 2),
        0
      );

      return {
        session_id: sessionId,
        items,
        confidence_score: confidenceScore,
        suggestions,
        total_estimate: totalEstimate,
      };
    } catch (error) {
      console.error('Error generating shopping list:', error);
      throw new BadRequestException('Failed to generate shopping list');
    }
  }

  getSession(sessionId: string): LlmSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getConversationContext(sessionId: string): LlmSession | null {
    return this.sessions.get(sessionId) || null;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getAllSessions(): LlmSession[] {
    return Array.from(this.sessions.values());
  }

  getSessionsByUser(userId: string): LlmSession[] {
    // In a real implementation, you'd store user_id with sessions
    return Array.from(this.sessions.values()).filter(session => 
      session.session_id.includes(userId)
    );
  }

  cleanupExpiredSessions(maxAgeHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.created_at < cutoffTime) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  getSessionStats(): {
    total_sessions: number;
    active_sessions_last_hour: number;
    average_items_per_session: number;
    average_confidence_score: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const activeSessions = sessions.filter(s => s.updated_at > oneHourAgo);
    const totalItems = sessions.reduce((sum, s) => sum + s.current_items.length, 0);
    const totalConfidence = sessions.reduce((sum, s) => sum + s.confidence_score, 0);

    return {
      total_sessions: sessions.length,
      active_sessions_last_hour: activeSessions.length,
      average_items_per_session: sessions.length > 0 ? totalItems / sessions.length : 0,
      average_confidence_score: sessions.length > 0 ? totalConfidence / sessions.length : 0,
    };
  }

  async processVoiceInput(audioUrl: string, options?: {
    language?: string;
    existing_items?: string[];
    dietary_restrictions?: string[];
    budget_level?: number;
  }): Promise<{
    transcription: string;
    shopping_list: GenerateShoppingListResponse;
    processing_time_ms: number;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: Transcribe audio to text
      const transcription = await this.transcribeAudio(audioUrl, options?.language);

      // Step 2: Generate shopping list from transcription
      const shoppingList = await this.generateShoppingList({
        input: transcription,
        existing_items: options?.existing_items,
        dietary_restrictions: options?.dietary_restrictions,
        budget_level: options?.budget_level,
      });

      const processingTime = Date.now() - startTime;

      return {
        transcription,
        shopping_list: shoppingList,
        processing_time_ms: processingTime,
      };
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw new BadRequestException('Failed to process voice input');
    }
  }

  async transcribeAudio(audioUrl: string, language: string = 'ja'): Promise<string> {
    if (!this.openai) {
      // Mock transcription for development
      return 'おでんを作りたいです。大根とちくわはあります。春菊はいりません。';
    }

    try {
      // Download audio file (in production, you'd want to stream this)
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioFile = new File([new Uint8Array(audioBuffer)], 'audio.wav', { type: 'audio/wav' });

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'text',
      });

      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new BadRequestException('Failed to transcribe audio');
    }
  }

  async updateShoppingList(
    sessionId: string,
    modifications: string
  ): Promise<GenerateShoppingListResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      let updatedItems: ShoppingItem[];
      let confidenceScore: number;
      let suggestions: string[];

      if (this.openai) {
        // Use GPT-4o mini to process modifications intelligently
        const result = await this.processModifications(session, modifications);
        updatedItems = result.items;
        confidenceScore = result.confidence_score;
        suggestions = result.suggestions;
      } else {
        // Mock implementation for development/testing
        updatedItems = [...session.current_items];
        confidenceScore = 0.8;
        suggestions = ['Items updated based on your request'];
      }

      session.current_items = updatedItems;
      session.previous_items = updatedItems;
      session.updated_at = new Date();
      
      // Add to conversation history
      session.conversation_history.push({
        user_input: modifications,
        assistant_response: `Updated shopping list with ${updatedItems.length} items`,
        items_generated: updatedItems,
        timestamp: new Date(),
      });

      const totalEstimate = updatedItems.reduce(
        (sum, item) => sum + ((item.price_min + item.price_max) / 2),
        0
      );

      return {
        session_id: sessionId,
        items: updatedItems,
        confidence_score: confidenceScore,
        suggestions,
        total_estimate: totalEstimate,
      };
    } catch (error) {
      console.error('Error updating shopping list:', error);
      throw new BadRequestException('Failed to update shopping list');
    }
  }

  private async processModifications(session: LlmSession, modifications: string): Promise<{
    items: ShoppingItem[];
    confidence_score: number;
    suggestions: string[];
  }> {
    const systemPrompt = `You are an advanced AI shopping assistant using GPT-4o mini to update a shopping list based on user modifications.

Current items: ${JSON.stringify(session.current_items)}
User modifications: "${modifications}"

Intelligently update the shopping list according to the user's request. You can:
- Add new items with appropriate quantities and price ranges
- Remove existing items
- Modify quantities or specifications
- Suggest better alternatives
- Consider seasonal availability and Japanese market prices

Respond ONLY in valid JSON format matching the original structure.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: modifications },
      ],
      temperature: 0.6, // Slightly lower temperature for more consistent modifications
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return this.parseOpenAIResponse(response);
  }

  private async callOpenAI(request: GenerateShoppingListRequest): Promise<{
    items: ShoppingItem[];
    confidence_score: number;
    suggestions: string[];
  }> {
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return this.parseOpenAIResponse(response);
  }

  private buildSystemPrompt(request: GenerateShoppingListRequest): string {
    return `You are an advanced AI shopping assistant powered by GPT-4o mini for a Japanese grocery delivery service called "Otsukai DX". 
Your task is to efficiently convert natural language requests into structured shopping lists with high accuracy.

Guidelines:
- Parse the user's input to identify food items, quantities, and cooking intentions
- Suggest reasonable quantities and price ranges in Japanese Yen (realistic market prices)
- Consider dietary restrictions: ${request.dietary_restrictions?.join(', ') || 'none specified'}
- Budget level (1-5): ${request.budget_level || 3} (1=budget-friendly, 5=premium quality)
- Existing items to exclude: ${request.existing_items?.join(', ') || 'none'}
- Suggest 2-3 alternatives for each item when possible
- Provide helpful cooking tips or additional suggestions
- Be culturally aware of Japanese cooking practices and ingredient availability

Respond ONLY in valid JSON format:
{
  "items": [
    {
      "name": "商品名",
      "qty": "数量",
      "price_min": 最低価格,
      "price_max": 最高価格,
      "alternatives": ["代替品1", "代替品2"],
      "notes": "メモ"
    }
  ],
  "confidence_score": 0.0-1.0,
  "suggestions": ["追加提案1", "追加提案2"]
}`;
  }

  private buildUserPrompt(request: GenerateShoppingListRequest): string {
    let prompt = `ユーザーの要望: "${request.input}"`;
    
    if (request.existing_items?.length) {
      prompt += `\n既に持っているもの: ${request.existing_items.join(', ')}`;
    }
    
    if (request.dietary_restrictions?.length) {
      prompt += `\n食事制限: ${request.dietary_restrictions.join(', ')}`;
    }
    
    if (request.budget_level) {
      const budgetLabels = {
        1: '節約志向',
        2: 'やや節約',
        3: '標準',
        4: 'やや高品質',
        5: '高品質志向'
      };
      prompt += `\n予算レベル: ${budgetLabels[request.budget_level as keyof typeof budgetLabels]}`;
    }

    return prompt;
  }

  private parseOpenAIResponse(response: string): {
    items: ShoppingItem[];
    confidence_score: number;
    suggestions: string[];
  } {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        items: parsed.items || [],
        confidence_score: parsed.confidence_score || 0.8,
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      // Fallback to mock data if parsing fails
      return {
        items: this.parseMockInput(response),
        confidence_score: 0.6,
        suggestions: ['OpenAI応答の解析に失敗しました。基本的な商品リストを生成しました。'],
      };
    }
  }

  private generateSessionId(): string {
    return `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseMockInput(input: string): ShoppingItem[] {
    // Mock parsing logic - in reality would use LLM to parse natural language
    const mockItems: ShoppingItem[] = [];

    if (input.toLowerCase().includes('おでん') || input.toLowerCase().includes('oden')) {
      mockItems.push(
        {
          name: '大根',
          qty: '1本',
          price_min: 150,
          price_max: 250,
          alternatives: ['カブ', '人参'],
          notes: 'おでん用に厚めにカット',
        },
        {
          name: 'こんにゃく',
          qty: '1パック',
          price_min: 100,
          price_max: 180,
          alternatives: ['しらたき'],
        },
        {
          name: 'おでんの素',
          qty: '1袋',
          price_min: 200,
          price_max: 300,
          alternatives: ['だしの素', '昆布だし'],
        }
      );
    }

    if (input.toLowerCase().includes('milk') || input.toLowerCase().includes('牛乳')) {
      mockItems.push({
        name: '牛乳',
        qty: '1L',
        price_min: 200,
        price_max: 300,
        alternatives: ['低脂肪乳', '豆乳'],
      });
    }

    if (input.toLowerCase().includes('bread') || input.toLowerCase().includes('パン')) {
      mockItems.push({
        name: '食パン',
        qty: '1斤',
        price_min: 150,
        price_max: 250,
        alternatives: ['全粒粉パン', 'ライ麦パン'],
      });
    }

    // If no specific items detected, add some generic items
    if (mockItems.length === 0) {
      mockItems.push(
        {
          name: '卵',
          qty: '1パック',
          price_min: 200,
          price_max: 300,
          alternatives: ['有精卵'],
        },
        {
          name: '米',
          qty: '2kg',
          price_min: 800,
          price_max: 1200,
          alternatives: ['玄米', '無洗米'],
        }
      );
    }

    return mockItems;
  }
}