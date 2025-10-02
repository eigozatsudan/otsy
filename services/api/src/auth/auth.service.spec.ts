import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password_hash: 'hashedpassword',
    display_name: 'Test User',
    avatar_url: null,
    first_name: 'Test',
    last_name: 'User',
    phone: '+81-90-1234-5678',
    role: 'user',
    subscription_tier: 'free',
    last_active_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };



  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      admin: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    service = new AuthService(prismaService, jwtService, configService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password when credentials are valid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { last_active_at: expect.any(Date) },
      });

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: null,
        first_name: 'Test',
        last_name: 'User',
        phone: '+81-90-1234-5678',
        role: 'user',
        subscription_tier: 'free',
        last_active_at: mockUser.last_active_at,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
    });

    it('should return null when credentials are invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.admin, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');

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
    it('should create a new user with all fields', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        display_name: 'New User',
        first_name: 'New',
        last_name: 'User',
        phone: '+81-90-1111-2222',
      };

      jest.spyOn(service as any, 'findUserByEmail').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        display_name: registerDto.display_name,
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        phone: registerDto.phone,
        avatar_url: null,
      });

      const result = await service.registerUser(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password_hash: 'hashedpassword',
          display_name: registerDto.display_name,
          first_name: registerDto.first_name,
          last_name: registerDto.last_name,
          phone: registerDto.phone,
        },
        select: {
          id: true,
          email: true,
          display_name: true,
          first_name: true,
          last_name: true,
          phone: true,
          role: true,
          subscription_tier: true,
          created_at: true,
        },
      });

      expect(result.email).toBe(registerDto.email);
      expect(result.display_name).toBe(registerDto.display_name);
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        display_name: 'Existing User',
      };

      jest.spyOn(service as any, 'findUserByEmail').mockResolvedValue(mockUser);

      await expect(service.registerUser(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile with all fields', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getUserProfile('1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          id: true,
          email: true,
          display_name: true,
          first_name: true,
          last_name: true,
          phone: true,
          subscription_tier: true,
          role: true,
          last_active_at: true,
          created_at: true,
          updated_at: true,
        },
      });

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        phone: '+81-90-1234-5678',
        role: 'user',
        subscriptionTier: 'free',
        isVerified: true,
        lastActiveAt: mockUser.last_active_at,
        createdAt: mockUser.created_at,
        updatedAt: mockUser.updated_at,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});