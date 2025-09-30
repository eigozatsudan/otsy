/**
 * CORS configuration and security headers
 */

import { NextRequest, NextResponse } from 'next/server';

export interface CORSOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface SecurityHeadersOptions {
  contentSecurityPolicy?: string | Record<string, string[]>;
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  contentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless';
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

/**
 * CORS handler class
 */
export class CORSHandler {
  private options: Required<CORSOptions>;

  constructor(options: CORSOptions = {}) {
    this.options = {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXTAUTH_URL || 'https://otsukai.app']
        : true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name',
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
      ...options,
    };
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string): boolean {
    if (typeof this.options.origin === 'boolean') {
      return this.options.origin;
    }

    if (typeof this.options.origin === 'string') {
      return origin === this.options.origin;
    }

    if (Array.isArray(this.options.origin)) {
      return this.options.origin.includes(origin);
    }

    if (typeof this.options.origin === 'function') {
      return this.options.origin(origin);
    }

    return false;
  }

  /**
   * Handle CORS for a request
   */
  handleCORS(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: this.options.optionsSuccessStatus });
      
      if (origin && this.isOriginAllowed(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }

      if (this.options.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      response.headers.set('Access-Control-Allow-Methods', this.options.methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
      response.headers.set('Access-Control-Max-Age', this.options.maxAge.toString());

      return response;
    }

    return null; // Let the request continue
  }

  /**
   * Add CORS headers to response
   */
  addCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const origin = request.headers.get('origin');

    if (origin && this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (this.options.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (this.options.exposedHeaders.length > 0) {
      response.headers.set('Access-Control-Expose-Headers', this.options.exposedHeaders.join(', '));
    }

    return response;
  }
}

/**
 * Security headers handler
 */
export class SecurityHeaders {
  private options: SecurityHeadersOptions;

  constructor(options: SecurityHeadersOptions = {}) {
    this.options = {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'https:'],
        'connect-src': ["'self'", 'https:'],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'self'"],
        'worker-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"],
        'manifest-src': ["'self'"],
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameOptions: 'DENY',
      contentTypeOptions: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        'camera': [],
        'microphone': [],
        'geolocation': [],
        'interest-cohort': [],
      },
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      ...options,
    };
  }

  /**
   * Generate CSP header value
   */
  private generateCSP(): string {
    if (typeof this.options.contentSecurityPolicy === 'string') {
      return this.options.contentSecurityPolicy;
    }

    if (typeof this.options.contentSecurityPolicy === 'object') {
      return Object.entries(this.options.contentSecurityPolicy)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
    }

    return '';
  }

  /**
   * Generate Permissions Policy header value
   */
  private generatePermissionsPolicy(): string {
    if (!this.options.permissionsPolicy) return '';

    return Object.entries(this.options.permissionsPolicy)
      .map(([directive, allowlist]) => {
        if (allowlist.length === 0) {
          return `${directive}=()`;
        }
        return `${directive}=(${allowlist.join(' ')})`;
      })
      .join(', ');
  }

  /**
   * Add security headers to response
   */
  addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
    // Content Security Policy
    const csp = this.generateCSP();
    if (csp) {
      response.headers.set('Content-Security-Policy', csp);
    }

    // HTTP Strict Transport Security (HTTPS only)
    if (request.url.startsWith('https://') && this.options.hsts) {
      let hstsValue = `max-age=${this.options.hsts.maxAge}`;
      if (this.options.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.options.hsts.preload) {
        hstsValue += '; preload';
      }
      response.headers.set('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options
    if (this.options.frameOptions) {
      response.headers.set('X-Frame-Options', this.options.frameOptions);
    }

    // X-Content-Type-Options
    if (this.options.contentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (this.options.referrerPolicy) {
      response.headers.set('Referrer-Policy', this.options.referrerPolicy);
    }

    // Permissions Policy
    const permissionsPolicy = this.generatePermissionsPolicy();
    if (permissionsPolicy) {
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    // Cross-Origin Embedder Policy
    if (this.options.crossOriginEmbedderPolicy) {
      response.headers.set('Cross-Origin-Embedder-Policy', this.options.crossOriginEmbedderPolicy);
    }

    // Cross-Origin Opener Policy
    if (this.options.crossOriginOpenerPolicy) {
      response.headers.set('Cross-Origin-Opener-Policy', this.options.crossOriginOpenerPolicy);
    }

    // Cross-Origin Resource Policy
    if (this.options.crossOriginResourcePolicy) {
      response.headers.set('Cross-Origin-Resource-Policy', this.options.crossOriginResourcePolicy);
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    return response;
  }
}

/**
 * Predefined security configurations
 */
export const SecurityConfigs = {
  /**
   * Strict security configuration for production
   */
  strict: {
    cors: new CORSHandler({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXTAUTH_URL || 'https://otsukai.app']
        : false,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
    headers: new SecurityHeaders({
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https://cdn.otsukai.app'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'none'"],
        'worker-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"],
      },
      frameOptions: 'DENY',
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
    }),
  },

  /**
   * Development security configuration
   */
  development: {
    cors: new CORSHandler({
      origin: true,
      credentials: true,
    }),
    headers: new SecurityHeaders({
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'http:'],
        'font-src': ["'self'", 'https:', 'data:'],
        'connect-src': ["'self'", 'ws:', 'wss:', 'https:', 'http:'],
      },
      frameOptions: 'SAMEORIGIN',
    }),
  },

  /**
   * API-only security configuration
   */
  api: {
    cors: new CORSHandler({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXTAUTH_URL || 'https://otsukai.app']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
    headers: new SecurityHeaders({
      contentSecurityPolicy: "default-src 'none'",
      frameOptions: 'DENY',
      crossOriginResourcePolicy: 'same-origin',
    }),
  },
};

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(config: keyof typeof SecurityConfigs = 'strict') {
  const { cors, headers } = SecurityConfigs[config];

  return (handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) => {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
      // Handle CORS preflight
      const corsResponse = cors.handleCORS(request);
      if (corsResponse) {
        return headers.addSecurityHeaders(corsResponse, request);
      }

      // Execute the handler
      const response = await handler(request, ...args);

      // Add CORS and security headers
      cors.addCORSHeaders(response, request);
      headers.addSecurityHeaders(response, request);

      return response;
    };
  };
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  
  if (!origin) {
    // Allow requests without origin (same-origin requests)
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Check if request is from allowed referer
 */
export function validateReferer(request: NextRequest, allowedReferers: string[]): boolean {
  const referer = request.headers.get('referer');
  
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return allowedReferers.some(allowed => {
      const allowedUrl = new URL(allowed);
      return refererUrl.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}