import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto, RegisterShopperDto, RegisterAdminDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    // Try to find user in all three tables
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...result } = user;
      return { ...result, role: 'user' };
    }

    const shopper = await this.prisma.shopper.findUnique({ where: { email } });
    if (shopper && await bcrypt.compare(password, shopper.password_hash)) {
      const { password_hash, ...result } = shopper;
      return { ...result, role: 'shopper' };
    }

    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (admin && await bcrypt.compare(password, admin.password_hash)) {
      const { password_hash, ...result } = admin;
      return { ...result, role: 'admin' };
    }

    return null;
  }

  async validateShopper(email: string, password: string) {
    const shopper = await this.prisma.shopper.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        kyc_status: true,
        risk_tier: true,
        rating_avg: true,
        rating_count: true,
        status: true,
        is_online: true,
        created_at: true,
        updated_at: true,
        password_hash: true,
      }
    });
    if (shopper && await bcrypt.compare(password, shopper.password_hash)) {
      const { password_hash, ...result } = shopper;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async loginShopper(shopper: any) {
    const payload: JwtPayload = {
      sub: shopper.id,
      email: shopper.email,
      role: 'shopper',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      shopper: {
        id: shopper.id,
        email: shopper.email,
        firstName: shopper.first_name || '',
        lastName: shopper.last_name || '',
        phone: shopper.phone,
        status: shopper.is_online ? 'available' : 'offline',
        rating: shopper.rating_avg || 0,
        totalOrders: shopper.rating_count || 0,
        kycStatus: shopper.kyc_status || 'pending',
        riskTier: shopper.risk_tier || 'L0',
        isVerified: shopper.kyc_status === 'approved',
        createdAt: shopper.created_at,
        updatedAt: shopper.updated_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Validate user still exists
      const user = await this.validateUserById(payload.sub, payload.role);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async registerUser(registerDto: RegisterUserDto) {
    const existingUser = await this.findUserByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        phone: registerDto.phone,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        subscription_tier: true,
        created_at: true,
      },
    });

    return { ...user, role: 'user' };
  }

  async registerShopper(registerDto: RegisterShopperDto) {
    const existingUser = await this.findUserByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user first
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        phone: registerDto.phone,
        role: 'shopper',
      },
    });

    const shopper = await this.prisma.shopper.create({
      data: {
        user_id: user.id,
        email: registerDto.email,
        password_hash: hashedPassword,
        phone: registerDto.phone,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        kyc_status: true,
        risk_tier: true,
        rating_avg: true,
        rating_count: true,
        status: true,
        is_online: true,
        created_at: true,
        updated_at: true,
      },
    });

    return { ...shopper, role: 'shopper' };
  }

  async registerAdmin(registerDto: RegisterAdminDto) {
    const existingUser = await this.findUserByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        role: registerDto.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return { ...admin, role: 'admin' };
  }

  private async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) return user;

    const shopper = await this.prisma.shopper.findUnique({ where: { email } });
    if (shopper) return shopper;

    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (admin) return admin;

    return null;
  }

  private async validateUserById(id: string, role: string) {
    switch (role) {
      case 'user':
        return this.prisma.user.findUnique({ where: { id } });
      case 'shopper':
        return this.prisma.shopper.findUnique({ where: { id } });
      case 'admin':
        return this.prisma.admin.findUnique({ where: { id } });
      default:
        return null;
    }
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
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

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone,
      role: user.role,
      subscriptionTier: user.subscription_tier,
      isVerified: true, // Users are considered verified by default
      lastActiveAt: user.last_active_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async getShopperProfile(shopperId: string) {
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        status: true,
        rating_avg: true,
        rating_count: true,
        current_orders: true,
        kyc_status: true,
        risk_tier: true,
        is_online: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!shopper) {
      throw new UnauthorizedException('Shopper not found');
    }

    return {
      id: shopper.id,
      email: shopper.email,
      firstName: shopper.first_name || '',
      lastName: shopper.last_name || '',
      phone: shopper.phone,
      status: shopper.is_online ? 'available' : 'offline',
      rating: shopper.rating_avg || 0,
      totalOrders: shopper.rating_count || 0,
      kycStatus: shopper.kyc_status || 'pending',
      riskTier: shopper.risk_tier || 'L0',
      isVerified: shopper.kyc_status === 'approved',
      createdAt: shopper.created_at,
      updatedAt: shopper.updated_at,
    };
  }
}