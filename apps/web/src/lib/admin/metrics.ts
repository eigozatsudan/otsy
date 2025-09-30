import { db } from '@/lib/database';

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  activeGroups: number;
  totalPurchases: number;
  totalSpent: number;
  averageGroupSize: number;
  systemUptime: number;
  errorRate: number;
  responseTime: number;
  timestamp: string;
}

/**
 * Get system metrics for the specified time range
 */
export async function getSystemMetrics(
  timeRange: string = '24h',
  forceRefresh: boolean = false
): Promise<SystemMetrics> {
  try {
    // Calculate time range
    const now = new Date();
    const timeRangeMs = getTimeRangeMs(timeRange);
    const startTime = new Date(now.getTime() - timeRangeMs);

    // Get user metrics
    const userMetrics = await getUserMetrics(startTime, now);
    
    // Get group metrics
    const groupMetrics = await getGroupMetrics(startTime, now);
    
    // Get purchase metrics
    const purchaseMetrics = await getPurchaseMetrics(startTime, now);
    
    // Get system health metrics
    const healthMetrics = await getSystemHealthMetrics(startTime, now);

    return {
      ...userMetrics,
      ...groupMetrics,
      ...purchaseMetrics,
      ...healthMetrics,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    throw new Error('Failed to fetch system metrics');
  }
}

/**
 * Get user-related metrics
 */
async function getUserMetrics(startTime: Date, endTime: Date) {
  const totalUsers = await db.user.count();
  
  const activeUsers = await db.user.count({
    where: {
      lastActiveAt: {
        gte: startTime,
      },
    },
  });

  return {
    totalUsers,
    activeUsers,
  };
}

/**
 * Get group-related metrics
 */
async function getGroupMetrics(startTime: Date, endTime: Date) {
  const totalGroups = await db.group.count();
  
  const activeGroups = await db.group.count({
    where: {
      OR: [
        {
          lastActivityAt: {
            gte: startTime,
          },
        },
        {
          purchases: {
            some: {
              createdAt: {
                gte: startTime,
              },
            },
          },
        },
      ],
    },
  });

  // Calculate average group size
  const groupSizes = await db.group.findMany({
    select: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  const averageGroupSize = groupSizes.length > 0
    ? groupSizes.reduce((sum, group) => sum + group._count.members, 0) / groupSizes.length
    : 0;

  return {
    totalGroups,
    activeGroups,
    averageGroupSize,
  };
}

/**
 * Get purchase-related metrics
 */
async function getPurchaseMetrics(startTime: Date, endTime: Date) {
  const purchases = await db.purchase.findMany({
    where: {
      createdAt: {
        gte: startTime,
        lte: endTime,
      },
    },
    select: {
      amount: true,
    },
  });

  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

  return {
    totalPurchases,
    totalSpent,
  };
}

/**
 * Get system health metrics
 */
async function getSystemHealthMetrics(startTime: Date, endTime: Date) {
  // Get error logs
  const errorLogs = await db.errorLog.count({
    where: {
      createdAt: {
        gte: startTime,
        lte: endTime,
      },
    },
  });

  // Get total requests
  const totalRequests = await db.requestLog.count({
    where: {
      createdAt: {
        gte: startTime,
        lte: endTime,
      },
    },
  });

  // Calculate error rate
  const errorRate = totalRequests > 0 ? (errorLogs / totalRequests) * 100 : 0;

  // Get average response time
  const responseTimeData = await db.requestLog.aggregate({
    where: {
      createdAt: {
        gte: startTime,
        lte: endTime,
      },
    },
    _avg: {
      responseTime: true,
    },
  });

  const responseTime = responseTimeData._avg.responseTime || 0;

  // Calculate system uptime (mock for now)
  const systemUptime = Math.floor((Date.now() - startTime.getTime()) / 1000);

  return {
    errorRate,
    responseTime,
    systemUptime,
  };
}

/**
 * Convert time range string to milliseconds
 */
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h':
      return 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return 90 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000; // Default to 24h
  }
}

/**
 * Get metrics history for charting
 */
export async function getMetricsHistory(
  timeRange: string = '7d',
  interval: string = '1h'
): Promise<SystemMetrics[]> {
  try {
    const now = new Date();
    const timeRangeMs = getTimeRangeMs(timeRange);
    const intervalMs = getTimeRangeMs(interval);
    const startTime = new Date(now.getTime() - timeRangeMs);

    const history: SystemMetrics[] = [];
    
    for (let time = startTime.getTime(); time <= now.getTime(); time += intervalMs) {
      const periodStart = new Date(time);
      const periodEnd = new Date(Math.min(time + intervalMs, now.getTime()));
      
      const metrics = await getSystemMetrics('1h'); // Get metrics for this period
      history.push({
        ...metrics,
        timestamp: periodStart.toISOString(),
      });
    }

    return history;
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    throw new Error('Failed to fetch metrics history');
  }
}