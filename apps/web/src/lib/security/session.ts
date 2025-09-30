/**
 * Secure session management and token handling
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export interface SessionData {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  permissions?: string[];
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  permissions?: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

export interface SessionOptions {
  maxAge?: number; // Session duration in seconds
  secure?: boolean; // HTTPS only
  httpOnly?: boolean; // Prevent XSS
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

/**
 * Session manager class
 */
export class SessionManager {
  private static readonly DEFAULT_MAX_AGE = 24 * 60 * 60; // 24 hours
  private static readonly REFRESH_THRESHOLD = 60 * 60; // 1 hour
  private static readonly SECRET_KEY = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production'
  );

  private options: Required<SessionOptions>;
  private activeSessions: Map<string, SessionData> = new Map();

  constructor(options: SessionOptions = {}) {
    this.options = {
      maxAge: SessionManager.DEFAULT_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      domain: undefined,
      path: '/',
      ...options,
    };
  }

  /**
   * Create a new session
   */
  async createSession(
    userData: Omit<SessionData, 'lastActivity' | 'sessionId'>,
    request?: NextRequest
  ): Promise<{
    token: string;
    sessionId: string;
    expiresAt: Date;
  }> {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date((now + this.options.maxAge) * 1000);

    // Create session data
    const sessionData: SessionData = {
      ...userData,
      lastActivity: now,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    };

    // Store session
    this.activeSessions.set(sessionId, sessionData);

    // Create JWT token
    const token = await new SignJWT({
      userId: userData.userId,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions || [],
      sessionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + this.options.maxAge)
      .setIssuer('otsy-app')
      .setAudience('otsy-users')
      .sign(SessionManager.SECRET_KEY);

    return {
      token,
      sessionId,
      expiresAt,
    };
  }

  /**
   * Verify and decode session token
   */
  async verifySession(token: string, request?: NextRequest): Promise<{
    isValid: boolean;
    payload?: TokenPayload;
    sessionData?: SessionData;
    needsRefresh?: boolean;
  }> {
    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, SessionManager.SECRET_KEY, {
        issuer: 'otsy-app',
        audience: 'otsy-users',
      });

      const tokenPayload = payload as TokenPayload;
      const sessionData = this.activeSessions.get(tokenPayload.sessionId);

      if (!sessionData) {
        return { isValid: false };
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (tokenPayload.exp < now) {
        this.destroySession(tokenPayload.sessionId);
        return { isValid: false };
      }

      // Validate session consistency
      if (!this.validateSessionConsistency(sessionData, tokenPayload, request)) {
        this.destroySession(tokenPayload.sessionId);
        return { isValid: false };
      }

      // Update last activity
      sessionData.lastActivity = now;
      this.activeSessions.set(tokenPayload.sessionId, sessionData);

      // Check if token needs refresh
      const needsRefresh = (tokenPayload.exp - now) < SessionManager.REFRESH_THRESHOLD;

      return {
        isValid: true,
        payload: tokenPayload,
        sessionData,
        needsRefresh,
      };
    } catch (error) {
      console.error('Session verification failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(
    sessionId: string,
    request?: NextRequest
  ): Promise<{
    token: string;
    expiresAt: Date;
  } | null> {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date((now + this.options.maxAge) * 1000);

    // Update session data
    sessionData.lastActivity = now;
    if (request) {
      sessionData.ipAddress = this.getClientIP(request);
      sessionData.userAgent = request.headers.get('user-agent') || undefined;
    }

    this.activeSessions.set(sessionId, sessionData);

    // Create new JWT token
    const token = await new SignJWT({
      userId: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
      permissions: sessionData.permissions || [],
      sessionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + this.options.maxAge)
      .setIssuer('otsy-app')
      .setAudience('otsy-users')
      .sign(SessionManager.SECRET_KEY);

    return {
      token,
      expiresAt,
    };
  }

  /**
   * Destroy session
   */
  destroySession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): void {
    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      if (sessionData.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  getUserSessions(userId: string): Array<SessionData & { sessionId: string }> {
    const sessions: Array<SessionData & { sessionId: string }> = [];
    
    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      if (sessionData.userId === userId) {
        sessions.push({ ...sessionData, sessionId });
      }
    }

    return sessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Math.floor(Date.now() / 1000);
    const expiredThreshold = now - this.options.maxAge;

    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      if (sessionData.lastActivity < expiredThreshold) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Set session cookie
   */
  setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
    response.cookies.set('session-token', token, {
      expires: expiresAt,
      secure: this.options.secure,
      httpOnly: this.options.httpOnly,
      sameSite: this.options.sameSite,
      domain: this.options.domain,
      path: this.options.path,
    });
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(response: NextResponse): void {
    response.cookies.delete('session-token');
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Get client IP address
   */
  private getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined;

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    return request.ip;
  }

  /**
   * Validate session consistency
   */
  private validateSessionConsistency(
    sessionData: SessionData,
    tokenPayload: TokenPayload,
    request?: NextRequest
  ): boolean {
    // Check user ID consistency
    if (sessionData.userId !== tokenPayload.userId) {
      return false;
    }

    // Check IP address consistency (optional, can be disabled for mobile users)
    if (process.env.ENFORCE_IP_CONSISTENCY === 'true' && request) {
      const currentIP = this.getClientIP(request);
      if (sessionData.ipAddress && currentIP && sessionData.ipAddress !== currentIP) {
        return false;
      }
    }

    return true;
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static readonly SECRET_KEY = process.env.CSRF_SECRET || 'csrf-secret-key';

  /**
   * Generate CSRF token
   */
  static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const random = randomBytes(16).toString('hex');
    const data = `${sessionId}:${timestamp}:${random}`;
    const hash = createHash('sha256').update(data + this.SECRET_KEY).digest('hex');
    
    return Buffer.from(`${data}:${hash}`).toString('base64');
  }

  /**
   * Verify CSRF token
   */
  static verifyToken(token: string, sessionId: string, maxAge: number = 3600000): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parts = decoded.split(':');
      
      if (parts.length !== 4) {
        return false;
      }

      const [tokenSessionId, timestamp, random, hash] = parts;

      // Check session ID
      if (tokenSessionId !== sessionId) {
        return false;
      }

      // Check timestamp
      const tokenTime = parseInt(timestamp);
      if (Date.now() - tokenTime > maxAge) {
        return false;
      }

      // Verify hash
      const data = `${tokenSessionId}:${timestamp}:${random}`;
      const expectedHash = createHash('sha256').update(data + this.SECRET_KEY).digest('hex');
      
      return timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    } catch {
      return false;
    }
  }

  /**
   * Add CSRF token to response
   */
  static addTokenToResponse(response: NextResponse, sessionId: string): void {
    const token = this.generateToken(sessionId);
    response.headers.set('X-CSRF-Token', token);
  }

  /**
   * Validate CSRF token from request
   */
  static validateRequest(request: NextRequest, sessionId: string): boolean {
    const token = request.headers.get('x-csrf-token') || 
                 request.headers.get('csrf-token');

    if (!token) {
      return false;
    }

    return this.verifyToken(token, sessionId);
  }
}

/**
 * Secure token utilities
 */
export class SecureTokens {
  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Generate time-limited token
   */
  static generateTimeLimitedToken(data: string, expiresIn: number = 3600): string {
    const expires = Date.now() + (expiresIn * 1000);
    const payload = `${data}:${expires}`;
    const hash = createHash('sha256').update(payload + process.env.TOKEN_SECRET).digest('hex');
    
    return Buffer.from(`${payload}:${hash}`).toString('base64');
  }

  /**
   * Verify time-limited token
   */
  static verifyTimeLimitedToken(token: string, expectedData: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parts = decoded.split(':');
      
      if (parts.length !== 3) {
        return false;
      }

      const [data, expires, hash] = parts;

      // Check data
      if (data !== expectedData) {
        return false;
      }

      // Check expiration
      if (Date.now() > parseInt(expires)) {
        return false;
      }

      // Verify hash
      const payload = `${data}:${expires}`;
      const expectedHash = createHash('sha256').update(payload + process.env.TOKEN_SECRET).digest('hex');
      
      return timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    } catch {
      return false;
    }
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(userId: string, email: string): string {
    return this.generateTimeLimitedToken(`${userId}:${email}`, 3600); // 1 hour
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string, userId: string, email: string): boolean {
    return this.verifyTimeLimitedToken(token, `${userId}:${email}`);
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(userId: string, email: string): string {
    return this.generateTimeLimitedToken(`${userId}:${email}`, 86400); // 24 hours
  }

  /**
   * Verify email verification token
   */
  static verifyEmailVerificationToken(token: string, userId: string, email: string): boolean {
    return this.verifyTimeLimitedToken(token, `${userId}:${email}`);
  }
}

/**
 * Session middleware factory
 */
export function createSessionMiddleware(sessionManager: SessionManager) {
  return async (request: NextRequest) => {
    const token = request.cookies.get('session-token')?.value;
    
    if (!token) {
      return null; // No session
    }

    const verification = await sessionManager.verifySession(token, request);
    
    if (!verification.isValid) {
      // Invalid session, clear cookie
      const response = NextResponse.next();
      sessionManager.clearSessionCookie(response);
      return response;
    }

    // Add user info to request headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', verification.sessionData!.userId);
    response.headers.set('x-user-role', verification.sessionData!.role);
    response.headers.set('x-session-id', verification.payload!.sessionId);

    // Refresh token if needed
    if (verification.needsRefresh) {
      const refreshResult = await sessionManager.refreshSession(
        verification.payload!.sessionId,
        request
      );
      
      if (refreshResult) {
        sessionManager.setSessionCookie(response, refreshResult.token, refreshResult.expiresAt);
      }
    }

    return response;
  };
}

// Global session manager instance
export const sessionManager = new SessionManager({
  maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours default
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});

// Cleanup expired sessions every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    sessionManager.cleanupExpiredSessions();
  }, 60 * 60 * 1000);
}