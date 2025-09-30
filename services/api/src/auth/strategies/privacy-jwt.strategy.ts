import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrivacyAuthService } from '../privacy-auth.service';

export interface PrivacyJwtPayload {
  sub: string; // user ID
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class PrivacyJwtStrategy extends PassportStrategy(Strategy, 'privacy-jwt') {
  constructor(
    private configService: ConfigService,
    private authService: PrivacyAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: PrivacyJwtPayload) {
    try {
      const user = await this.authService.validateJwtPayload(payload);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      console.error('JWT validation error:', {
        userId: payload.sub,
        email: payload.email,
        error: error.message,
      });
      throw new UnauthorizedException('Authentication failed');
    }
  }
}