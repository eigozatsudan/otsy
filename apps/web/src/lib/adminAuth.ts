import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  permissions: string[];
}

/**
 * Verify admin access from request
 */
export async function verifyAdminAccess(request: NextRequest): Promise<AdminUser | null> {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Verify token
    const user = await verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: 'admin',
      permissions: user.permissions || [],
    };
  } catch (error) {
    console.error('Admin access verification error:', error);
    return null;
  }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(admin: AdminUser, permission: string): boolean {
  return admin.permissions.includes(permission) || admin.permissions.includes('*');
}

/**
 * Admin permission constants
 */
export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: 'admin:view_dashboard',
  MANAGE_USERS: 'admin:manage_users',
  SUSPEND_USERS: 'admin:suspend_users',
  MODERATE_CONTENT: 'admin:moderate_content',
  VIEW_REPORTS: 'admin:view_reports',
  MANAGE_SYSTEM: 'admin:manage_system',
  EXPORT_DATA: 'admin:export_data',
  RESOLVE_ALERTS: 'admin:resolve_alerts',
} as const;

/**
 * Middleware for checking admin permissions
 */
export function requirePermission(permission: string) {
  return async (request: NextRequest, admin: AdminUser) => {
    if (!hasPermission(admin, permission)) {
      throw new Error(`Insufficient permissions: ${permission} required`);
    }
    return true;
  };
}