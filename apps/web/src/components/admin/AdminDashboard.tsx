'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';
import AccessibleButton from '@/components/accessibility/AccessibleButton';

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  activeGroups: number;
  totalMessages: number;
  totalPurchases: number;
  totalRevenue: number;
  adImpressions: number;
  adClicks: number;
  reportedContent: number;
  suspendedUsers: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

interface AdminDashboardProps {
  metrics: PlatformMetrics;
  systemHealth: SystemHealth;
  onRefreshMetrics: () => void;
  className?: string;
}

export default function AdminDashboard({
  metrics,
  systemHealth,
  onRefreshMetrics,
  className = '',
}: AdminDashboardProps) {
  const { reducedMotion } = useAccessibility();
  const { announce } = useAnnouncer();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const handleRefresh = () => {
    onRefreshMetrics();
    announce('Metrics refreshed', 'polite');
  };

  const getHealthStatusColor = () => {
    switch (systemHealth.status) {
      case 'healthy':
        return 'text-success-600 bg-success-100 border-success-200';
      case 'warning':
        return 'text-warning-600 bg-warning-100 border-warning-200';
      case 'critical':
        return 'text-error-600 bg-error-100 border-error-200';
      default:
        return 'text-neutral-600 bg-neutral-100 border-neutral-200';
    }
  };

  return (
    <div className={clsx('space-y-fib-6', className)}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-mobile-xl font-bold text-neutral-900\">
            Admin Dashboard
          </h1>
          <p className=\"text-mobile-sm text-neutral-600 mt-fib-1\">
            Platform overview and system monitoring
          </p>
        </div>
        
        <div className=\"flex items-center space-x-fib-2\">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className=\"px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm\"
          >
            <option value=\"24h\">Last 24 hours</option>
            <option value=\"7d\">Last 7 days</option>
            <option value=\"30d\">Last 30 days</option>
          </select>
          
          <AccessibleButton
            variant=\"outline\"
            size=\"md\"
            onClick={handleRefresh}
          >
            <svg className=\"w-4 h-4 mr-fib-1\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
            </svg>
            Refresh
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
} 
     {/* System Health Status */}
      <div className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\">
        <div className=\"flex items-center justify-between mb-fib-4\">
          <h2 className=\"text-mobile-lg font-semibold text-neutral-900\">
            System Health
          </h2>
          <span className={clsx(
            'inline-flex items-center px-fib-2 py-fib-1 rounded-full text-xs font-medium border',
            getHealthStatusColor()
          )}>
            <div className={clsx(
              'w-2 h-2 rounded-full mr-fib-1',
              {
                'bg-success-500': systemHealth.status === 'healthy',
                'bg-warning-500': systemHealth.status === 'warning',
                'bg-error-500': systemHealth.status === 'critical',
              }
            )} />
            {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
          </span>
        </div>

        <div className=\"grid grid-cols-2 lg:grid-cols-4 gap-fib-4\">
          <div className=\"text-center\">
            <div className=\"text-mobile-lg font-bold text-neutral-900\">
              {Math.round(systemHealth.uptime)}%
            </div>
            <div className=\"text-mobile-sm text-neutral-600\">Uptime</div>
          </div>
          
          <div className=\"text-center\">
            <div className=\"text-mobile-lg font-bold text-neutral-900\">
              {systemHealth.responseTime}ms
            </div>
            <div className=\"text-mobile-sm text-neutral-600\">Response Time</div>
          </div>
          
          <div className=\"text-center\">
            <div className=\"text-mobile-lg font-bold text-neutral-900\">
              {systemHealth.errorRate.toFixed(2)}%
            </div>
            <div className=\"text-mobile-sm text-neutral-600\">Error Rate</div>
          </div>
          
          <div className=\"text-center\">
            <div className=\"text-mobile-lg font-bold text-neutral-900\">
              {Math.round(systemHealth.memoryUsage)}%
            </div>
            <div className=\"text-mobile-sm text-neutral-600\">Memory Usage</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-fib-4\">
        <motion.div
          className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\"
          whileHover={reducedMotion ? {} : { y: -2 }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
        >
          <div className=\"flex items-center justify-between mb-fib-2\">
            <h3 className=\"text-mobile-sm font-medium text-neutral-600\">Total Users</h3>
            <svg className=\"w-5 h-5 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z\" />
            </svg>
          </div>
          <div className=\"text-mobile-xl font-bold text-neutral-900\">
            {metrics.totalUsers.toLocaleString()}
          </div>
          <div className=\"text-mobile-sm text-success-600 mt-fib-1\">
            {metrics.activeUsers.toLocaleString()} active
          </div>
        </motion.div>

        <motion.div
          className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\"
          whileHover={reducedMotion ? {} : { y: -2 }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
        >
          <div className=\"flex items-center justify-between mb-fib-2\">
            <h3 className=\"text-mobile-sm font-medium text-neutral-600\">Groups</h3>
            <svg className=\"w-5 h-5 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" />
            </svg>
          </div>
          <div className=\"text-mobile-xl font-bold text-neutral-900\">
            {metrics.totalGroups.toLocaleString()}
          </div>
          <div className=\"text-mobile-sm text-success-600 mt-fib-1\">
            {metrics.activeGroups.toLocaleString()} active
          </div>
        </motion.div>

        <motion.div
          className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\"
          whileHover={reducedMotion ? {} : { y: -2 }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
        >
          <div className=\"flex items-center justify-between mb-fib-2\">
            <h3 className=\"text-mobile-sm font-medium text-neutral-600\">Messages</h3>
            <svg className=\"w-5 h-5 text-primary-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
            </svg>
          </div>
          <div className=\"text-mobile-xl font-bold text-neutral-900\">
            {metrics.totalMessages.toLocaleString()}
          </div>
          <div className=\"text-mobile-sm text-neutral-500 mt-fib-1\">
            Total sent
          </div>
        </motion.div>

        <motion.div
          className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\"
          whileHover={reducedMotion ? {} : { y: -2 }}
          transition={reducedMotion ? {} : { duration: 0.2 }}
        >
          <div className=\"flex items-center justify-between mb-fib-2\">
            <h3 className=\"text-mobile-sm font-medium text-neutral-600\">Revenue</h3>
            <svg className=\"w-5 h-5 text-success-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1\" />
            </svg>
          </div>
          <div className=\"text-mobile-xl font-bold text-neutral-900\">
            ${metrics.totalRevenue.toLocaleString()}
          </div>
          <div className=\"text-mobile-sm text-success-600 mt-fib-1\">
            Ad revenue
          </div>
        </motion.div>
      </div>

      {/* Ad Performance */}
      <div className=\"bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-4\">
        <h2 className=\"text-mobile-lg font-semibold text-neutral-900 mb-fib-4\">
          Ad Performance
        </h2>
        
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-fib-4\">
          <div className=\"text-center p-fib-3 bg-primary-50 rounded-lg\">
            <div className=\"text-mobile-lg font-bold text-primary-900\">
              {metrics.adImpressions.toLocaleString()}
            </div>
            <div className=\"text-mobile-sm text-primary-700\">Impressions</div>
          </div>
          
          <div className=\"text-center p-fib-3 bg-success-50 rounded-lg\">
            <div className=\"text-mobile-lg font-bold text-success-900\">
              {metrics.adClicks.toLocaleString()}
            </div>
            <div className=\"text-mobile-sm text-success-700\">Clicks</div>
          </div>
          
          <div className=\"text-center p-fib-3 bg-warning-50 rounded-lg\">
            <div className=\"text-mobile-lg font-bold text-warning-900\">
              {((metrics.adClicks / metrics.adImpressions) * 100).toFixed(2)}%
            </div>
            <div className=\"text-mobile-sm text-warning-700\">CTR</div>
          </div>
        </div>
      </div>

      {/* Moderation Alerts */}
      {metrics.reportedContent > 0 && (
        <div className=\"bg-warning-50 border border-warning-200 rounded-xl p-fib-4\">
          <div className=\"flex items-center space-x-fib-2\">
            <svg className=\"w-5 h-5 text-warning-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z\" />
            </svg>
            <div>
              <h3 className=\"text-mobile-base font-semibold text-warning-900\">
                Content Moderation Required
              </h3>
              <p className=\"text-mobile-sm text-warning-800\">
                {metrics.reportedContent} pieces of content need review
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}          
  <div className="flex items-center justify-between mb-fib-4">
              <h3 className="text-mobile-base font-semibold text-neutral-900">
                Security Alerts
              </h3>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                className="px-fib-2 py-fib-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-mobile-sm"
                aria-label="Filter alerts by severity"
              >
                <option value="all">All Severities</option>
                <option value="high">High & Critical</option>
                <option value="critical">Critical Only</option>
              </select>
            </div>

            <div className="space-y-fib-2">
              {securityAlerts
                .filter(alert => {
                  if (filterSeverity === 'all') return true;
                  if (filterSeverity === 'critical') return alert.severity === 'critical';
                  if (filterSeverity === 'high') return alert.severity === 'high' || alert.severity === 'critical';
                  return true;
                })
                .sort((a, b) => {
                  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                  return severityOrder[b.severity] - severityOrder[a.severity];
                })
                .map((alert) => (
                  <div key={alert.id} className={clsx(
                    'border rounded-lg p-fib-3',
                    alert.resolved ? 'border-neutral-200 bg-neutral-50' : 'border-error-200 bg-error-50'
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-fib-2 mb-fib-1">
                          <div className={clsx('flex items-center space-x-fib-1', {
                            'text-error-600': alert.severity === 'critical',
                            'text-warning-600': alert.severity === 'high',
                            'text-primary-600': alert.severity === 'medium',
                            'text-neutral-600': alert.severity === 'low',
                          })}>
                            {getAlertIcon(alert.type)}
                            <span className="text-mobile-sm font-medium">
                              {alert.title}
                            </span>
                          </div>
                          <span className={clsx(
                            'px-fib-1 py-0.5 rounded-full text-xs font-medium border',
                            getSeverityColor(alert.severity)
                          )}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.resolved && (
                            <span className="px-fib-1 py-0.5 bg-success-100 text-success-800 rounded-full text-xs font-medium">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        
                        <p className="text-mobile-sm text-neutral-700 mb-fib-2">
                          {alert.description}
                        </p>
                        
                        <div className="text-mobile-xs text-neutral-600 space-x-fib-3">
                          <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                          {alert.userId && (
                            <>
                              <span>•</span>
                              <span>User ID: {alert.userId}</span>
                            </>
                          )}
                          {alert.groupId && (
                            <>
                              <span>•</span>
                              <span>Group ID: {alert.groupId}</span>
                            </>
                          )}
                          {alert.resolved && alert.resolvedBy && (
                            <>
                              <span>•</span>
                              <span>Resolved by: {alert.resolvedBy} at {new Date(alert.resolvedAt!).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {!alert.resolved && (
                        <AccessibleButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleAlertResolve(alert.id)}
                        >
                          Resolve
                        </AccessibleButton>
                      )}
                    </div>
                  </div>
                ))}
              
              {securityAlerts.filter(alert => {
                if (filterSeverity === 'all') return true;
                if (filterSeverity === 'critical') return alert.severity === 'critical';
                if (filterSeverity === 'high') return alert.severity === 'high' || alert.severity === 'critical';
                return true;
              }).length === 0 && (
                <div className="text-center py-fib-8 text-neutral-500">
                  <svg className="w-12 h-12 mx-auto mb-fib-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-mobile-sm">No security alerts match the current filter</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}