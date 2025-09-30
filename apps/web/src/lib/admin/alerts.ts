export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'suspicious_activity' | 'data_breach' | 'policy_violation' | 'system_error';

export interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date | string;
  userId?: string;
  groupId?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date | string;
}

export async function getSecurityAlerts(params: {
  page: number;
  limit: number;
  severity?: AlertSeverity;
  type?: AlertType;
  resolved?: boolean;
}): Promise<{ items: SecurityAlert[]; total: number; page: number; limit: number }> {
  const items: SecurityAlert[] = [
    {
      id: 'alert-1',
      type: 'suspicious_activity',
      severity: 'high',
      title: 'Suspicious login pattern',
      description: 'Multiple failed logins detected',
      timestamp: new Date().toISOString(),
      userId: 'user-1',
      resolved: false,
    },
  ];
  return { items, total: items.length, page: params.page, limit: params.limit };
}

export async function resolveAlert(id: string, meta: { resolvedBy: string; resolvedAt: Date }) {
  return { id, ...meta };
}

export async function createAlert(input: {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  userId?: string;
  groupId?: string;
  createdBy: string;
  timestamp: Date;
}): Promise<SecurityAlert> {
  return {
    id: `alert-${Date.now()}`,
    ...input,
    resolved: false,
  };
}


