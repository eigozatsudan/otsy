import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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
    // Clean database before each test
    await prismaService.cleanDb();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register/user (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      };

      return request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.role).toBe('user');
        });
    });

    it('should return 409 when email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      };

      // Register user first time
      await request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(201);

      // Try to register same email again
      return request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(409);
    });

    it('should return 400 for invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for short password', () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
      };

      return request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/register/shopper (POST)', () => {
    it('should register a new shopper', () => {
      const registerDto = {
        email: 'shopper@example.com',
        password: 'password123',
        phone: '+81-90-8765-4321',
      };

      return request(app.getHttpServer())
        .post('/v1/auth/register/shopper')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.role).toBe('shopper');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      };

      // Register user first
      await request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(201);

      // Login with same credentials
      const loginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(loginDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
          expect(res.body.user.email).toBe(loginDto.email);
        });
    });

    it('should return 401 for invalid credentials', () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh access token with valid refresh token', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      };

      // Register and get tokens
      const registerResponse = await request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(201);

      const { refresh_token } = registerResponse.body;

      // Use refresh token to get new access token
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refresh_token })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refresh_token: 'invalid_token' })
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user profile with valid token', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      };

      // Register and get token
      const registerResponse = await request(app.getHttpServer())
        .post('/v1/auth/register/user')
        .send(registerDto)
        .expect(201);

      const { access_token } = registerResponse.body;

      // Get profile with token
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.role).toBe('user');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });
});