import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrivacyAuthService } from './privacy-auth.service';
import { PrivacyAuthController } from './privacy-auth.controller';
import { PrivacyJwtStrategy } from './strategies/privacy-jwt.strategy';
import { PrivacyJwtAuthGuard } from './guards/privacy-jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '15m', // Short-lived access tokens for security
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PrivacyAuthController],
  providers: [
    PrivacyAuthService,
    PrivacyJwtStrategy,
    PrivacyJwtAuthGuard,
  ],
  exports: [
    PrivacyAuthService,
    PrivacyJwtAuthGuard,
  ],
})
export class PrivacyAuthModule {}