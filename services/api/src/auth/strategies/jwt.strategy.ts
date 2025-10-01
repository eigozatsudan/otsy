import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: id, role } = payload;

    try {
      let user;
      switch (role) {
        case 'user':
          user = await this.usersService.findOne(id);
          break;
        case 'admin':
          user = await this.prisma.admin.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              role: true,
              created_at: true,
              updated_at: true,
            },
          });
          break;
        default:
          throw new UnauthorizedException('Invalid role');
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return { ...user, role };
    } catch (error) {
      console.error('JWT validation error:', {
        id,
        role,
        error: error.message,
        stack: error.stack
      });
      throw new UnauthorizedException('Authentication failed');
    }
  }
}