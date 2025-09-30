/**
 * Rate limiting implementation for API endpoints
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
      ...config,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now;
    const windowEnd = now + this.config.windowMs;

    // Initialize or reset if window expired
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 0,
        resetTime: windowEnd,
      };
    }

    const current = this.store[key];
    const allowed = current.count < this.config.maxRequests;

    if (allowed) {
      current.count++;
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      resetTime: current.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((current.resetTime - now) / 1000),
    };
  }

  async recordRequest(request: NextRequest, success: boolean): Promise<void> {
    if (
      (success && this.config.skipSuccessfulRequests) ||
      (!success && this.config.skipFailedRequests)
    ) {
      return;
    }

    // Request is already recorded in checkLimit
  }
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Authentication endpoints (more restrictive)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Password reset (very restrictive)
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later.',
  }),

  // File upload endpoints
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many file uploads, please try again later.',
  }),

  // Group creation (prevent spam)
  groupCreation: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many groups created, please try again later.',
  }),

  // Message sending
  messaging: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many messages sent, please slow down.',
  }),

  // Admin endpoints (very restrictive)
  admin: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    keyGenerator: (request) => {
      // Use user ID for admin endpoints
      const userId = request.headers.get('x-user-id') || 'anonymous';
      return `admin:${userId}`;
    },
  }),
};

/**
 * Middleware function to apply rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: NextRequest) => {
    const result = await limiter.checkLimit(request);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later.',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}

/**
 * Rate limit decorator for API routes
 */
export function withRateLimit(limiter: RateLimiter) {
  return function (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) {
    return async (request: NextRequest, ...args: any[]): Promise<Response> => {
      const rateLimitResponse = await createRateLimitMiddleware(limiter)(request);
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      try {
        const response = await handler(request, ...args);
        await limiter.recordRequest(request, response.ok);
        
        // Add rate limit headers to successful responses
        const result = await limiter.checkLimit(request);
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        
        return response;
      } catch (error) {
        await limiter.recordRequest(request, false);
        throw error;
      }
    };
  };
}

/**
 * Advanced rate limiting with different strategies
 */
export class AdvancedRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();

  constructor(private configs: Record<string, RateLimitConfig>) {
    Object.entries(configs).forEach(([key, config]) => {
      this.limiters.set(key, new RateLimiter(config));
    });
  }

  async checkLimits(request: NextRequest, strategies: string[]): Promise<{
    allowed: boolean;
    failedStrategy?: string;
    headers: Record<string, string>;
  }> {
    const headers: Record<string, string> = {};
    
    for (const strategy of strategies) {
      const limiter = this.limiters.get(strategy);
      if (!limiter) continue;

      const result = await limiter.checkLimit(request);
      
      // Add headers for this strategy
      headers[`X-RateLimit-${strategy}-Limit`] = result.limit.toString();
      headers[`X-RateLimit-${strategy}-Remaining`] = result.remaining.toString();
      headers[`X-RateLimit-${strategy}-Reset`] = new Date(result.resetTime).toISOString();

      if (!result.allowed) {
        if (result.retryAfter) {
          headers['Retry-After'] = result.retryAfter.toString();
        }
        
        return {
          allowed: false,
          failedStrategy: strategy,
          headers,
        };
      }
    }

    return {
      allowed: true,
      headers,
    };
  }
}

/**
 * Sliding window rate limiter (more accurate but memory intensive)
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {
    // Clean up old requests every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    
    this.requests.forEach((timestamps, key) => {
      const validTimestamps = timestamps.filter(ts => ts > cutoff);
      
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    });
  }

  checkLimit(key: string): {
    allowed: boolean;
    count: number;
    resetTime: number;
  } {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    // Get existing requests for this key
    const timestamps = this.requests.get(key) || [];
    
    // Filter out old requests
    const validTimestamps = timestamps.filter(ts => ts > cutoff);
    
    const allowed = validTimestamps.length < this.maxRequests;
    
    if (allowed) {
      validTimestamps.push(now);
      this.requests.set(key, validTimestamps);
    }

    return {
      allowed,
      count: validTimestamps.length,
      resetTime: validTimestamps.length > 0 ? validTimestamps[0] + this.windowMs : now + this.windowMs,
    };
  }
}