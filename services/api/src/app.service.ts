import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Otsy API is running!';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'otsukai-dx-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}