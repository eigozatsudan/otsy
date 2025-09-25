import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('LlmController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean database
    await prismaService.cleanDb();

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/v1/auth/register/user')
      .send({
        email: 'user@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      })
      .expect(201);

    userToken = userResponse.body.access_token;
    userId = userResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/llm/generate-shopping-list (POST)', () => {
    it('should generate shopping list from text input', () => {
      const requestBody = {
        input: 'おでんを作りたい。大根とちくわはある。',
        existing_items: ['大根', 'ちくわ'],
        dietary_restrictions: [],
        budget_level: 3,
      };

      return request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.session_id).toBeDefined();
          expect(res.body.items).toBeDefined();
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.confidence_score).toBeGreaterThan(0);
          expect(res.body.total_estimate).toBeGreaterThan(0);
          expect(res.body.suggestions).toBeDefined();
        });
    });

    it('should handle English input', () => {
      const requestBody = {
        input: 'I need milk and bread',
        existing_items: [],
        budget_level: 2,
      };

      return request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.items.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for empty input', () => {
      const requestBody = {
        input: '',
      };

      return request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(400);
    });

    it('should return 401 without token', () => {
      const requestBody = {
        input: 'test input',
      };

      return request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .send(requestBody)
        .expect(401);
    });
  });

  describe('/llm/audio-upload-url (POST)', () => {
    it('should generate audio upload URL', () => {
      const requestBody = {
        file_extension: 'wav',
      };

      return request(app.getHttpServer())
        .post('/v1/llm/audio-upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.upload_url).toBeDefined();
          expect(res.body.file_url).toBeDefined();
          expect(res.body.upload_url).toContain('audio/');
        });
    });

    it('should default to wav extension', () => {
      return request(app.getHttpServer())
        .post('/v1/llm/audio-upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201)
        .expect((res) => {
          expect(res.body.upload_url).toContain('.wav');
        });
    });
  });

  describe('/llm/transcribe (POST)', () => {
    it('should transcribe audio (mock)', () => {
      const requestBody = {
        audio_url: 'http://example.com/audio.wav',
        language: 'ja',
      };

      return request(app.getHttpServer())
        .post('/v1/llm/transcribe')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.transcription).toBeDefined();
          expect(res.body.language).toBe('ja');
          expect(typeof res.body.transcription).toBe('string');
        });
    });

    it('should default to Japanese language', () => {
      const requestBody = {
        audio_url: 'http://example.com/audio.wav',
      };

      return request(app.getHttpServer())
        .post('/v1/llm/transcribe')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.language).toBe('ja');
        });
    });
  });

  describe('/llm/sessions/:sessionId (GET)', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const response = await request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          input: 'test input',
          existing_items: [],
        })
        .expect(201);

      sessionId = response.body.session_id;
    });

    it('should retrieve session by ID', () => {
      return request(app.getHttpServer())
        .get(`/v1/llm/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.session_id).toBe(sessionId);
          expect(res.body.items).toBeDefined();
          expect(res.body.confidence_score).toBeDefined();
          expect(res.body.created_at).toBeDefined();
        });
    });

    it('should return error for non-existent session', () => {
      return request(app.getHttpServer())
        .get('/v1/llm/sessions/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.error).toBe('Session not found');
        });
    });
  });

  describe('/llm/sessions/:sessionId (PATCH)', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const response = await request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          input: 'おでんを作りたい',
          existing_items: [],
        })
        .expect(201);

      sessionId = response.body.session_id;
    });

    it('should update shopping list', () => {
      const requestBody = {
        modifications: '春菊を追加してください',
      };

      return request(app.getHttpServer())
        .patch(`/v1/llm/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(200)
        .expect((res) => {
          expect(res.body.session_id).toBe(sessionId);
          expect(res.body.items).toBeDefined();
          expect(res.body.confidence_score).toBeDefined();
        });
    });

    it('should return 400 for non-existent session', () => {
      const requestBody = {
        modifications: 'test modification',
      };

      return request(app.getHttpServer())
        .patch('/v1/llm/sessions/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(400);
    });
  });

  describe('/llm/sessions/:sessionId/clear (POST)', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const response = await request(app.getHttpServer())
        .post('/v1/llm/generate-shopping-list')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          input: 'test input',
          existing_items: [],
        })
        .expect(201);

      sessionId = response.body.session_id;
    });

    it('should clear session', () => {
      return request(app.getHttpServer())
        .post(`/v1/llm/sessions/${sessionId}/clear`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Session cleared successfully');
        });
    });

    it('should return success even for non-existent session', () => {
      return request(app.getHttpServer())
        .post('/v1/llm/sessions/non-existent-id/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);
    });
  });

  describe('/llm/process-voice (POST)', () => {
    it('should process voice input (mock)', () => {
      const requestBody = {
        audio_url: 'http://example.com/audio.wav',
        language: 'ja',
        existing_items: [],
        dietary_restrictions: [],
        budget_level: 3,
      };

      return request(app.getHttpServer())
        .post('/v1/llm/process-voice')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.transcription).toBeDefined();
          expect(res.body.shopping_list).toBeDefined();
          expect(res.body.processing_time_ms).toBeDefined();
          expect(res.body.shopping_list.session_id).toBeDefined();
          expect(res.body.shopping_list.items).toBeDefined();
        });
    });

    it('should return 400 for invalid audio URL', () => {
      const requestBody = {
        audio_url: 'invalid-url',
      };

      return request(app.getHttpServer())
        .post('/v1/llm/process-voice')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(400);
    });
  });
});