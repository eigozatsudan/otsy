export interface AdminUserActivity {
  userId: string;
  userName: string;
  email: string;
  lastActive: string;
  groupCount: number;
  purchaseCount: number;
  totalSpent: number;
  riskScore: number;
  flags: string[];
}

export async function getUserActivities(params: {
  page: number;
  limit: number;
  sortBy?: string;
  filterRisk?: number;
  search?: string | null;
}): Promise<{ items: AdminUserActivity[]; total: number; page: number; limit: number }> {
  const items: AdminUserActivity[] = [
    {
      userId: 'user-001',
      userName: 'John Doe',
      email: 'john.doe@example.com',
      lastActive: new Date().toISOString(),
      groupCount: 3,
      purchaseCount: 12,
      totalSpent: 456.78,
      riskScore: 85,
      flags: ['High spending', 'Multiple groups'],
    },
  ];
  return { items, total: items.length, page: params.page, limit: params.limit };
}

export async function getUserById(userId: string) {
  return {
    id: userId,
    email: 'user@example.com',
    userName: 'Example User',
  };
}

export async function suspendUser(
  userId: string,
  payload: { reason: string; duration?: number | null; suspendedBy: string; suspendedAt: Date } | null
) {
  return { userId, payload };
}


