export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

// Minimal mock token verification used by API routes
export async function verifyToken(token: string): Promise<AuthUser | null> {
  if (!token) return null;
  // In real app, verify JWT and fetch user
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
  };
}


