import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null), // No OpenAI key for testing (uses mock implementation)
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateShoppingList', () => {
    it('should generate shopping list from text input', async () => {
      const request = {
        input: 'おでんを作りたい。大根とちくわはある。',
        existing_items: ['大根', 'ちくわ'],
        dietary_restrictions: [],
        budget_level: 3,
      };

      const result = await service.generateShoppingList(request);

      expect(result).toBeDefined();
      expect(result.session_id).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.confidence_score).toBeGreaterThan(0);
      expect(result.total_estimate).toBeGreaterThan(0);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle milk request', async () => {
      const request = {
        input: 'I need milk',
        existing_items: [],
      };

      const result = await service.generateShoppingList(request);

      expect(result.items.some(item => item.name.includes('牛乳'))).toBe(true);
    });

    it('should handle bread request', async () => {
      const request = {
        input: 'パンが欲しい',
        existing_items: [],
      };

      const result = await service.generateShoppingList(request);

      expect(result.items.some(item => item.name.includes('パン'))).toBe(true);
    });
  });

  describe('session management', () => {
    it('should create and retrieve session', async () => {
      const request = {
        input: 'test input',
        existing_items: [],
      };

      const result = await service.generateShoppingList(request);
      const session = service.getSession(result.session_id);

      expect(session).toBeDefined();
      expect(session?.session_id).toBe(result.session_id);
      expect(session?.user_input).toBe('test input');
    });

    it('should return null for non-existent session', () => {
      const session = service.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should clear session', async () => {
      const request = {
        input: 'test input',
        existing_items: [],
      };

      const result = await service.generateShoppingList(request);
      service.clearSession(result.session_id);
      
      const session = service.getSession(result.session_id);
      expect(session).toBeNull();
    });
  });

  describe('updateShoppingList', () => {
    it('should update existing session', async () => {
      const request = {
        input: 'おでんを作りたい',
        existing_items: [],
      };

      const initialResult = await service.generateShoppingList(request);
      const updateResult = await service.updateShoppingList(
        initialResult.session_id,
        '春菊を追加してください'
      );

      expect(updateResult.session_id).toBe(initialResult.session_id);
      expect(updateResult.items).toBeDefined();
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        service.updateShoppingList('non-existent', 'modifications')
      ).rejects.toThrow('Session not found');
    });
  });

  describe('transcribeAudio', () => {
    it('should return mock transcription when OpenAI is not configured', async () => {
      const result = await service.transcribeAudio('http://example.com/audio.wav');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Mock returns Japanese text for testing
      expect(result).toContain('おでん');
    });
  });

  describe('processVoiceInput', () => {
    it('should process voice input and return transcription and shopping list', async () => {
      const result = await service.processVoiceInput('http://example.com/audio.wav', {
        language: 'ja',
        existing_items: [],
        dietary_restrictions: [],
        budget_level: 3,
      });

      expect(result.transcription).toBeDefined();
      expect(result.shopping_list).toBeDefined();
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(result.shopping_list.items).toBeDefined();
    });
  });

  describe('session statistics', () => {
    it('should return session statistics', async () => {
      // Create a few sessions
      await service.generateShoppingList({ input: 'test 1', existing_items: [] });
      await service.generateShoppingList({ input: 'test 2', existing_items: [] });

      const stats = service.getSessionStats();

      expect(stats.total_sessions).toBe(2);
      expect(stats.active_sessions_last_hour).toBe(2);
      expect(stats.average_items_per_session).toBeGreaterThan(0);
      expect(stats.average_confidence_score).toBeGreaterThan(0);
    });

    it('should cleanup expired sessions', async () => {
      // Create a session
      const result = await service.generateShoppingList({ 
        input: 'test', 
        existing_items: [] 
      });

      // Manually set old timestamp
      const session = service.getSession(result.session_id);
      if (session) {
        session.created_at = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      }

      const cleanedCount = service.cleanupExpiredSessions(24);
      expect(cleanedCount).toBe(1);

      const sessionAfterCleanup = service.getSession(result.session_id);
      expect(sessionAfterCleanup).toBeNull();
    });
  });

  describe('conversation history', () => {
    it('should maintain conversation history', async () => {
      const request = {
        input: 'おでんを作りたい',
        existing_items: [],
      };

      const result = await service.generateShoppingList(request);
      const session = service.getSession(result.session_id);

      expect(session?.conversation_history).toBeDefined();
      expect(session?.conversation_history.length).toBe(1);
      expect(session?.conversation_history[0].user_input).toBe('おでんを作りたい');

      // Update the list
      await service.updateShoppingList(result.session_id, '春菊を追加');
      const updatedSession = service.getSession(result.session_id);

      expect(updatedSession?.conversation_history.length).toBe(2);
      expect(updatedSession?.conversation_history[1].user_input).toBe('春菊を追加');
    });
  });
});