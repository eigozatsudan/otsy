import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrivacyAuthService } from './privacy-auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

const mockBcrypt = require('bcrypt');

describe('PrivacyAuthService', () => {
    let service: PrivacyAuthService;
    let prisma: any;
    let jwtService: any;
    let configService: any;

    const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: null,
        created_at: new Date(),
        password_hash: 'hashedpassword',
    };

    beforeEach(async () => {
        const mockPrismaService = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            groupMember: {
                findFirst: jest.fn(),
                deleteMany: jest.fn(),
            },
            group: {
                update: jest.fn(),
                delete: jest.fn(),
            },
            message: {
                deleteMany: jest.fn(),
            },
            purchase: {
                updateMany: jest.fn(),
            },
            split: {
                deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        const mockJwtService = {
            signAsync: jest.fn(),
            verify: jest.fn(),
        };

        const mockConfigService = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrivacyAuthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<PrivacyAuthService>(PrivacyAuthService);
        prisma = module.get(PrismaService);
        jwtService = module.get(JwtService);
        configService = module.get(ConfigService);

        // Setup default mocks
        configService.get.mockImplementation((key: string) => {
            switch (key) {
                case 'JWT_SECRET':
                    return 'test-secret';
                case 'JWT_REFRESH_SECRET':
                    return 'test-refresh-secret';
                default:
                    return null;
            }
        });

        jwtService.signAsync.mockResolvedValue('mock-token');
    });

    describe('register', () => {
        const registerDto = {
            email: 'test@example.com',
            display_name: 'Test User',
            password: 'SecurePassword123!',
        };

        it('should register a new user successfully', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            mockBcrypt.hash.mockResolvedValue('hashedpassword');
            prisma.user.create.mockResolvedValue({
                id: 'user1',
                email: 'test@example.com',
                display_name: 'Test User',
                avatar_url: null,
                created_at: new Date(),
            });

            const result = await service.register(registerDto);

            expect(result.access_token).toBe('mock-token');
            expect(result.refresh_token).toBe('mock-token');
            expect(result.user.email).toBe('test@example.com');
            expect(result.user.display_name).toBe('Test User');
        });

        it('should throw ConflictException if email already exists', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'SecurePassword123!',
        };

        it('should login successfully with valid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            mockBcrypt.compare.mockResolvedValue(true);

            const result = await service.login(loginDto);

            expect(result.access_token).toBe('mock-token');
            expect(result.refresh_token).toBe('mock-token');
            expect(result.user.email).toBe('test@example.com');
            expect(result.user).not.toHaveProperty('password_hash');
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            mockBcrypt.compare.mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshToken', () => {
        const refreshTokenDto = {
            refresh_token: 'valid-refresh-token',
        };

        it('should refresh token successfully', async () => {
            jwtService.verify.mockReturnValue({ sub: 'user1', email: 'test@example.com' });
            prisma.user.findUnique.mockResolvedValue({
                id: 'user1',
                email: 'test@example.com',
                display_name: 'Test User',
                avatar_url: null,
                created_at: new Date(),
            });

            const result = await service.refreshToken(refreshTokenDto);

            expect(result.access_token).toBe('mock-token');
            expect(result.refresh_token).toBe('mock-token');
        });

        it('should throw UnauthorizedException for invalid token', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getProfile', () => {
        it('should return user profile successfully', async () => {
            const userProfile = {
                id: 'user1',
                email: 'test@example.com',
                display_name: 'Test User',
                avatar_url: null,
                created_at: new Date(),
            };
            prisma.user.findUnique.mockResolvedValue(userProfile);

            const result = await service.getProfile('user1');

            expect(result).toEqual(userProfile);
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getProfile('user1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateProfile', () => {
        const updateProfileDto = {
            display_name: 'Updated Name',
            avatar_url: 'https://example.com/avatar.jpg',
        };

        it('should update profile successfully', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            const updatedUser = {
                id: 'user1',
                email: 'test@example.com',
                display_name: 'Updated Name',
                avatar_url: 'https://example.com/avatar.jpg',
                created_at: new Date(),
            };
            prisma.user.update.mockResolvedValue(updatedUser);

            const result = await service.updateProfile('user1', updateProfileDto);

            expect(result.display_name).toBe('Updated Name');
            expect(result.avatar_url).toBe('https://example.com/avatar.jpg');
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.updateProfile('user1', updateProfileDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('changePassword', () => {
        const changePasswordDto = {
            current_password: 'OldPassword123!',
            new_password: 'NewPassword123!',
        };

        it('should change password successfully', async () => {
            prisma.user.findUnique.mockResolvedValue({ password_hash: 'oldhash' });
            mockBcrypt.compare.mockResolvedValue(true);
            mockBcrypt.hash.mockResolvedValue('newhash');

            await service.changePassword('user1', changePasswordDto);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { password_hash: 'newhash' },
            });
        });

        it('should throw BadRequestException for incorrect current password', async () => {
            prisma.user.findUnique.mockResolvedValue({ password_hash: 'oldhash' });
            mockBcrypt.compare.mockResolvedValue(false);

            await expect(service.changePassword('user1', changePasswordDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('forgotPassword', () => {
        it('should always return success message for privacy', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

            expect(result.message).toContain('If an account with this email exists');
        });
    });

    describe('deleteAccount', () => {
        it('should delete account successfully', async () => {
            const userWithGroups = {
                ...mockUser,
                created_groups: [{ id: 'group1' }],
                group_memberships: [{ group_id: 'group1' }],
            };

            prisma.user.findUnique.mockResolvedValue(userWithGroups);
            prisma.$transaction.mockImplementation(async (callback) => {
                return callback(prisma);
            });
            prisma.groupMember.findFirst.mockResolvedValue({ user_id: 'user2' });

            const result = await service.deleteAccount('user1');

            expect(result.message).toContain('Account deleted successfully');
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.deleteAccount('user1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('validateJwtPayload', () => {
        it('should validate JWT payload successfully', async () => {
            const payload = { sub: 'user1', email: 'test@example.com' };
            const userProfile = {
                id: 'user1',
                email: 'test@example.com',
                display_name: 'Test User',
                avatar_url: null,
            };
            prisma.user.findUnique.mockResolvedValue(userProfile);

            const result = await service.validateJwtPayload(payload);

            expect(result).toEqual(userProfile);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const payload = { sub: 'user1', email: 'test@example.com' };
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.validateJwtPayload(payload)).rejects.toThrow(UnauthorizedException);
        });
    });
});