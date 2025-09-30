import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PrivacyJwtAuthGuard extends AuthGuard('privacy-jwt') {}