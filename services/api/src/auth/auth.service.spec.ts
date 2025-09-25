import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password_hash: 'hashedpassword',
    phone: '+81-90-1234-5678',
    subscription_tier: 'basic',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockShopper = {
    id: '2',
    email: 'shopper@example.com',
    password_hash: 'hashedpassword',
    phone: '+81-90-8765-4321',
    kyc_status: 'approved',
    risk_tier: 'L1',
    rating_avg: 4.5,
    rating_count: 10,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            shopper: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            admin: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password when credentials are valid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        phone: '+81-90-1234-5678',
        subscription_tier: 'basic',
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
        role: 'user',
      });
    });

    it('should return null when credentials are invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.admin, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const mockTokens = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
      };

      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const user = { ...mockUser, role: 'user' };
      const result = await service.login(user);

      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    });
  });

  describe('registerUser', () => {
    it('should create a new user and return login tokens', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        phone: '+81-90-1111-2222',
      };

      jest.spyOn(service as any, 'findUserByEmail').mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        phone: registerDto.phone,
      });
      jest.spyOn(service, 'login').mockResolvedValue({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: { id: '1', email: registerDto.email, role: 'user' },
      });

      const result = await service.registerUser(registerDto);

      expect(result.access_token).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      jest.spyOn(service as any, 'findUserByEmail').mockResolvedValue(mockUser);

      await expect(service.registerUser(registerDto)).rejects.toThrow(ConflictException);
    });
  });
});