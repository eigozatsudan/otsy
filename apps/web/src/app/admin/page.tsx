'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import ContentModeration from '@/components/admin/ContentModeration';
import { useAuth } from '@/hooks/useAuth';
import { useAnnouncer } from '@/hooks/useAccessibility';

// Mock data interfaces (in real app, these would come from API)
interface SystemMetrics {
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
}

interface UserActivity {
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

interface GroupActivity {
  groupId: string;
  groupName: string;
  memberCount: number;
  createdAt: string;
  lastActivity: string;
  totalPurchases: number;
  totalSpent: number;
  riskScore: number;
  flags: string[];
}

interface SecurityAlert {
  id: string;
  type: 'suspicious_activity' | 'data_breach' | 'policy_violation' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  groupId?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { announce } = useAnnouncer();
  
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'users' | 'content' | 'reports' | 'settings'>('dashboard');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [groupActivities, setGroupActivities] = useState<GroupActivity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  // Check admin permissions
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      announce('Access denied. Admin privileges required.', 'assertive');
    }
  }, [user, isLoading, router, announce]);

  // Load mock data (in real app, this would be API calls)
  useEffect(() => {
    if (user?.role === 'admin') {
      loadMockData();
    }
  }, [user]);

  const loadMockData = () => {
    // Mock system metrics
    setMetrics({
      totalUsers: 15420,
      activeUsers: 8934,
      totalGroups: 2847,
      activeGroups: 1923,
      totalPurchases: 45678,
      totalSpent: 1234567.89,
      averageGroupSize: 5.4,
      systemUptime: 2592000, // 30 days in seconds
      errorRate: 0.12,
      responseTime: 145,
    });

    // Mock user activities
    setUserActivities([
      {
        userId: 'user-001',
        userName: 'John Doe',
        email: 'john.doe@example.com',
        lastActive: '2024-01-15T10:30:00Z',
        groupCount: 3,
        purchaseCount: 12,
        totalSpent: 456.78,
        riskScore: 85,
        flags: ['High spending', 'Multiple groups'],
      },
      {
        userId: 'user-002',
        userName: 'Jane Smith',
        email: 'jane.smith@example.com',
        lastActive: '2024-01-15T09:15:00Z',
        groupCount: 1,
        purchaseCount: 5,
        totalSpent: 123.45,
        riskScore: 25,
        flags: [],
      },
      {
        userId: 'user-003',
        userName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        lastActive: '2024-01-14T16:45:00Z',
        groupCount: 7,
        purchaseCount: 28,
        totalSpent: 1234.56,
        riskScore: 92,
        flags: ['Excessive group creation', 'High frequency purchases', 'Unusual spending pattern'],
      },
    ]);

    // Mock group activities
    setGroupActivities([
      {
        groupId: 'group-001',
        groupName: 'Weekend Warriors',
        memberCount: 8,
        createdAt: '2024-01-01T00:00:00Z',
        lastActivity: '2024-01-15T14:20:00Z',
        totalPurchases: 45,
        totalSpent: 2345.67,
        riskScore: 78,
        flags: ['High spending velocity'],
      },
      {
        groupId: 'group-002',
        groupName: 'Office Lunch Club',
        memberCount: 12,
        createdAt: '2023-12-15T00:00:00Z',
        lastActivity: '2024-01-15T12:00:00Z',
        totalPurchases: 23,
        totalSpent: 567.89,
        riskScore: 15,
        flags: [],
      },
    ]);

    // Mock security alerts
    setSecurityAlerts([
      {
        id: 'alert-001',
        type: 'suspicious_activity',
        severity: 'critical',
        title: 'Unusual Purchase Pattern Detected',
        description: 'User has made 15 purchases in the last hour, significantly above normal behavior.',
        timestamp: '2024-01-15T11:30:00Z',
        userId: 'user-001',
        resolved: false,
      },
      {
        id: 'alert-002',
        type: 'policy_violation',
        severity: 'high',
        title: 'Group Size Limit Exceeded',
        description: 'Group has exceeded the maximum allowed member count of 20.',
        timestamp: '2024-01-15T10:15:00Z',
        groupId: 'group-001',
        resolved: false,
      },
      {
        id: 'alert-003',
        type: 'system_error',
        severity: 'medium',
        title: 'Payment Processing Delay',
        description: 'Payment processing is experiencing delays. Average processing time increased to 5 minutes.',
        timestamp: '2024-01-15T09:45:00Z',
        resolved: true,
        resolvedBy: 'admin-001',
        resolvedAt: '2024-01-15T10:00:00Z',
      },
    ]);
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      // In real app, this would be an API call
      setSecurityAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { 
                ...alert, 
                resolved: true, 
                resolvedBy: user?.id || 'current-admin',
                resolvedAt: new Date().toISOString()
              }
            : alert
        )
      );
      announce('Security alert resolved successfully', 'polite');
    } catch (error) {
      announce('Failed to resolve security alert', 'assertive');
      throw error;
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      // In real app, this would be an API call
      console.log(`Suspending user ${userId} for reason: ${reason}`);
      announce(`User suspended: ${reason}`, 'polite');
    } catch (error) {
      announce('Failed to suspend user', 'assertive');
      throw error;
    }
  };

  const handleSuspendGroup = async (groupId: string, reason: string) => {
    try {
      // In real app, this would be an API call
      console.log(`Suspending group ${groupId} for reason: ${reason}`);
      announce(`Group suspended: ${reason}`, 'polite');
    } catch (error) {
      announce('Failed to suspend group', 'assertive');
      throw error;
    }
  };

  const handleExportData = async (type: 'users' | 'groups' | 'purchases' | 'alerts') => {
    try {
      // In real app, this would trigger a data export
      console.log(`Exporting ${type} data`);
      announce(`${type} data export started`, 'polite');
    } catch (error) {
      announce(`Failed to export ${type} data`, 'assertive');
      throw error;
    }
  };

  // Show loading or redirect if not admin
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return metrics ? (
          <AdminDashboard
            metrics={metrics}
            userActivities={userActivities}
            groupActivities={groupActivities}
            securityAlerts={securityAlerts}
            onResolveAlert={handleResolveAlert}
            onSuspendUser={handleSuspendUser}
            onSuspendGroup={handleSuspendGroup}
            onExportData={handleExportData}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        );
      
      case 'users':
        return (
          <UserManagement
            users={userActivities}
            onSuspendUser={handleSuspendUser}
            onExportData={handleExportData}
          />
        );
      
      case 'content':
        return (
          <ContentModeration
            onExportData={handleExportData}
          />
        );
      
      case 'reports':
        return (
          <div className="bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-6">
            <h2 className="text-mobile-lg font-bold text-neutral-900 mb-fib-4">
              Reports & Analytics
            </h2>
            <p className="text-neutral-600">
              Advanced reporting features coming soon...
            </p>
          </div>
        );
      
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-mobile-sm border border-neutral-200 p-fib-6">
            <h2 className="text-mobile-lg font-bold text-neutral-900 mb-fib-4">
              System Settings
            </h2>
            <p className="text-neutral-600">
              System configuration options coming soon...
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
    >
      {renderCurrentSection()}
    </AdminLayout>
  );
}