import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { 
  RegisterDto, 
  LoginDto, 
  UpdateProfileDto, 
  ChangePasswordDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  AuthResponseDto,
  UserProfileDto,
  RefreshTokenDto
} from './dto/auth.dto';

@Injectable()
export class PrivacyAuthService {
  private readonly saltRounds = 12;
  private readonly resetTokenExpiry = 1000 * 60 * 60; // 1 hour

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user with minimal PII collection
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, this.saltRounds);

    // Create user with minimal data
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        display_name: registerDto.display_name.trim(),
        password_hash: passwordHash,
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_url: true,
        created_at: true,
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: user,
    };
  }

  /**
   * Login with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_url: true,
        password_hash: true,
        created_at: true,
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Remove password hash from response
    const { password_hash, ...userProfile } = user;

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: userProfile,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          display_name: true,
          avatar_url: true,
          created_at: true,
        }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_url: true,
        created_at: true,
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile (display name and avatar only)
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.display_name && { display_name: updateProfileDto.display_name.trim() }),
        ...(updateProfileDto.avatar_url !== undefined && { avatar_url: updateProfileDto.avatar_url }),
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_url: true,
        created_at: true,
      }
    });

    return updatedUser;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.new_password, this.saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash }
    });
  }

  /**
   * Initiate password reset (email-only identification)
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email.toLowerCase() }
    });

    // Always return success message for privacy (don't reveal if email exists)
    if (!user) {
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + this.resetTokenExpiry);

    // Store reset token (in a real app, you'd store this in a separate table or cache)
    // For now, we'll use a simple approach with the user table
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // Note: In production, you'd want a separate password_reset_tokens table
        // For this demo, we'll add these fields to the user model if needed
      }
    });

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If an account with this email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    // In a real implementation, you'd validate the token from a separate table
    // For this demo, we'll implement a basic version
    
    // TODO: Implement proper token validation
    // const resetRecord = await this.prisma.passwordResetToken.findUnique({
    //   where: { token: resetPasswordDto.token }
    // });

    throw new BadRequestException('Password reset functionality requires email service configuration');
  }

  /**
   * Delete user account with data cleanup
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        created_groups: true,
        group_memberships: true,
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Handle group ownership transfer
      for (const group of user.created_groups) {
        const oldestMember = await tx.groupMember.findFirst({
          where: {
            group_id: group.id,
            user_id: { not: userId }
          },
          orderBy: { joined_at: 'asc' }
        });

        if (oldestMember) {
          // Transfer ownership to oldest member
          await tx.group.update({
            where: { id: group.id },
            data: { created_by: oldestMember.user_id }
          });
        } else {
          // No other members, delete the group
          await tx.group.delete({
            where: { id: group.id }
          });
        }
      }

      // Remove user from all groups
      await tx.groupMember.deleteMany({
        where: { user_id: userId }
      });

      // Delete user messages (preserve group functionality)
      await tx.message.deleteMany({
        where: { author_id: userId }
      });

      // Update purchases to anonymize (preserve group cost tracking)
      await tx.purchase.updateMany({
        where: { purchased_by: userId },
        data: { purchased_by: 'deleted-user' }
      });

      // Delete splits
      await tx.split.deleteMany({
        where: { user_id: userId }
      });

      // Delete user account
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return { message: 'Account deleted successfully. Group data has been preserved.' };
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: any): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_url: true,
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m', // Short-lived access token
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d', // Longer-lived refresh token
      }),
    ]);

    return { access_token, refresh_token };
  }
}