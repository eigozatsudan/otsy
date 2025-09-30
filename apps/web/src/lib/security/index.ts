/**
 * Security and privacy utilities
 * 
 * This module provides comprehensive security measures including:
 * - Rate limiting for API endpoints
 * - Input validation and sanitization
 * - Image processing with EXIF removal
 * - CORS configuration and security headers
 * - Secure session management
 * - Data export for privacy compliance
 * - CSRF protection
 * - Vulnerability prevention
 */

// Rate limiting
export {
  rateLimiters,
  createRateLimitMiddleware,
  withRateLimit,
  AdvancedRateLimiter,
  SlidingWindowRateLimiter,
} from './rateLimiter';

// Input validation and sanitization
export {
  ValidationPatterns,
  ValidationMessages,
  BaseValidator,
  StringValidator,
  NumberValidator,
  EmailValidator,
  ArrayValidator,
  ObjectValidator,
  Sanitizer,
  Validators,
  validateInput,
  validateBatch,
} from './validation';

export type { ValidationResult } from './validation';

// Image processing and security
export {
  ImageProcessor,
  ImageUploadSecurity,
} from './imageProcessing';

export type {
  ImageProcessingOptions,
  ImageMetadata,
  ProcessedImage,
} from './imageProcessing';

// CORS and security headers
export {
  CORSHandler,
  SecurityHeaders,
  SecurityConfigs,
  createSecurityMiddleware,
  validateOrigin,
  validateReferer,
  generateNonce,
} from './cors';

export type {
  CORSOptions,
  SecurityHeadersOptions,
} from './cors';

// Session management
export {
  SessionManager,
  CSRFProtection,
  SecureTokens,
  createSessionMiddleware,
  sessionManager,
} from './session';

export type {
  SessionData,
  TokenPayload,
  SessionOptions,
} from './session';

// Data export and privacy compliance
export {
  dataExportService,
  DataExportService,
} from './dataExport';

export type {
  ExportRequest,
  ExportResult,
  DataCategory,
  UserDataExport,
} from './dataExport';

// Security constants
export const SECURITY_CONSTANTS = {
  // Rate limiting
  RATE_LIMITS: {
    API_GENERAL: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    PASSWORD_RESET: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
    UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 },
    MESSAGING: { windowMs: 60 * 1000, maxRequests: 30 },
  },
  
  // File upload limits
  FILE_LIMITS: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['jpg', 'jpeg', 'png', 'webp'],
    MAX_DIMENSIONS: { width: 2048, height: 2048 },
  },
  
  // Session configuration
  SESSION: {
    MAX_AGE: 24 * 60 * 60, // 24 hours
    REFRESH_THRESHOLD: 60 * 60, // 1 hour
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  },
  
  // Token expiration times
  TOKEN_EXPIRY: {
    PASSWORD_RESET: 3600, // 1 hour
    EMAIL_VERIFICATION: 86400, // 24 hours
    CSRF: 3600, // 1 hour
  },
  
  // Export limits
  EXPORT: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    EXPIRY_DAYS: 7,
    CLEANUP_INTERVAL: 6 * 60 * 60 * 1000, // 6 hours
  },
} as const;

// Security middleware factory
export function createSecurityStack(options: {
  rateLimiter?: keyof typeof rateLimiters;
  cors?: 'strict' | 'development' | 'api';
  csrf?: boolean;
  session?: boolean;
} = {}) {
  const {
    rateLimiter = 'api',
    cors = 'strict',
    csrf = true,
    session = true,
  } = options;

  return async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResponse = await createRateLimitMiddleware(rateLimiters[rateLimiter])(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CORS and security headers
    const securityResponse = createSecurityMiddleware(cors);
    
    // Apply session management
    if (session) {
      const sessionResponse = await createSessionMiddleware(sessionManager)(request);
      if (sessionResponse) {
        return sessionResponse;
      }
    }

    // Apply CSRF protection for state-changing requests
    if (csrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const sessionId = request.headers.get('x-session-id');
      if (sessionId && !CSRFProtection.validateRequest(request, sessionId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return null; // Allow request to proceed
  };
}