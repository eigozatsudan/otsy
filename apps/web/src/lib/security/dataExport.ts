/**
 * Data export functionality for privacy compliance (GDPR, CCPA, etc.)
 */

import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import archiver from 'archiver';
import { createHash } from 'crypto';

export interface ExportRequest {
  userId: string;
  email: string;
  requestedAt: Date;
  format: 'json' | 'csv' | 'xml';
  includeDeleted?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  categories?: DataCategory[];
}

export interface ExportResult {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt: Date;
  fileSize?: number;
  checksum?: string;
  error?: string;
}

export type DataCategory = 
  | 'profile'
  | 'groups'
  | 'items'
  | 'purchases'
  | 'messages'
  | 'activity_logs'
  | 'preferences'
  | 'all';

export interface UserDataExport {
  exportInfo: {
    userId: string;
    email: string;
    exportedAt: string;
    format: string;
    categories: DataCategory[];
  };
  profile?: UserProfileData;
  groups?: GroupData[];
  items?: ItemData[];
  purchases?: PurchaseData[];
  messages?: MessageData[];
  activityLogs?: ActivityLogData[];
  preferences?: PreferenceData;
}

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  preferences: Record<string, any>;
}

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'member';
  joinedAt: string;
  inviteCode?: string; // Only for owners
  memberCount: number;
}

export interface ItemData {
  id: string;
  groupId: string;
  name: string;
  category: string;
  quantity: number;
  notes?: string;
  status: 'todo' | 'purchased' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PurchaseData {
  id: string;
  groupId: string;
  items: string[];
  amount: number;
  purchasedAt: string;
  receiptUrl?: string;
  splits: {
    userId: string;
    amount: number;
    percentage: number;
  }[];
}

export interface MessageData {
  id: string;
  groupId: string;
  content: string;
  itemId?: string;
  sentAt: string;
  editedAt?: string;
  attachments?: {
    type: 'image';
    url: string;
    filename: string;
  }[];
}

export interface ActivityLogData {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PreferenceData {
  notifications: Record<string, boolean>;
  privacy: Record<string, any>;
  accessibility: Record<string, any>;
  language: string;
  timezone: string;
}

/**
 * Data export service
 */
export class DataExportService {
  private static readonly EXPORT_EXPIRY_DAYS = 7;
  private static readonly MAX_EXPORT_SIZE = 100 * 1024 * 1024; // 100MB

  private exportRequests: Map<string, ExportRequest> = new Map();
  private exportResults: Map<string, ExportResult> = new Map();

  /**
   * Request data export
   */
  async requestExport(request: ExportRequest): Promise<string> {
    const exportId = this.generateExportId();
    
    // Store export request
    this.exportRequests.set(exportId, request);
    
    // Initialize export result
    const result: ExportResult = {
      exportId,
      status: 'pending',
      expiresAt: new Date(Date.now() + (DataExportService.EXPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)),
    };
    
    this.exportResults.set(exportId, result);

    // Start export process asynchronously
    this.processExport(exportId).catch(error => {
      console.error(`Export ${exportId} failed:`, error);
      this.updateExportStatus(exportId, 'failed', { error: error.message });
    });

    return exportId;
  }

  /**
   * Get export status
   */
  getExportStatus(exportId: string): ExportResult | null {
    return this.exportResults.get(exportId) || null;
  }

  /**
   * Process data export
   */
  private async processExport(exportId: string): Promise<void> {
    const request = this.exportRequests.get(exportId);
    if (!request) {
      throw new Error('Export request not found');
    }

    this.updateExportStatus(exportId, 'processing');

    try {
      // Collect user data
      const userData = await this.collectUserData(request);
      
      // Generate export file
      const { filePath, fileSize, checksum } = await this.generateExportFile(exportId, userData, request.format);
      
      // Update export result
      this.updateExportStatus(exportId, 'completed', {
        downloadUrl: `/api/exports/${exportId}/download`,
        fileSize,
        checksum,
      });

    } catch (error) {
      this.updateExportStatus(exportId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Collect user data from database
   */
  private async collectUserData(request: ExportRequest): Promise<UserDataExport> {
    const { userId, categories = ['all'], dateRange, includeDeleted = false } = request;

    const exportData: UserDataExport = {
      exportInfo: {
        userId,
        email: request.email,
        exportedAt: new Date().toISOString(),
        format: request.format,
        categories,
      },
    };

    // Collect profile data
    if (categories.includes('all') || categories.includes('profile')) {
      exportData.profile = await this.collectProfileData(userId);
    }

    // Collect groups data
    if (categories.includes('all') || categories.includes('groups')) {
      exportData.groups = await this.collectGroupsData(userId, dateRange);
    }

    // Collect items data
    if (categories.includes('all') || categories.includes('items')) {
      exportData.items = await this.collectItemsData(userId, dateRange, includeDeleted);
    }

    // Collect purchases data
    if (categories.includes('all') || categories.includes('purchases')) {
      exportData.purchases = await this.collectPurchasesData(userId, dateRange);
    }

    // Collect messages data
    if (categories.includes('all') || categories.includes('messages')) {
      exportData.messages = await this.collectMessagesData(userId, dateRange, includeDeleted);
    }

    // Collect activity logs
    if (categories.includes('all') || categories.includes('activity_logs')) {
      exportData.activityLogs = await this.collectActivityLogsData(userId, dateRange);
    }

    // Collect preferences
    if (categories.includes('all') || categories.includes('preferences')) {
      exportData.preferences = await this.collectPreferencesData(userId);
    }

    return exportData;
  }

  /**
   * Collect profile data
   */
  private async collectProfileData(userId: string): Promise<UserProfileData> {
    // In a real implementation, this would query the database
    // For now, return mock data structure
    return {
      id: userId,
      email: 'user@example.com',
      displayName: 'User Name',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      lastLoginAt: '2024-01-15T10:00:00Z',
      emailVerified: true,
      preferences: {},
    };
  }

  /**
   * Collect groups data
   */
  private async collectGroupsData(userId: string, dateRange?: ExportRequest['dateRange']): Promise<GroupData[]> {
    // Mock implementation
    return [
      {
        id: 'group-1',
        name: 'Family Shopping',
        description: 'Weekly grocery shopping',
        role: 'owner',
        joinedAt: '2024-01-01T00:00:00Z',
        inviteCode: 'ABC123DEF456',
        memberCount: 3,
      },
    ];
  }

  /**
   * Collect items data
   */
  private async collectItemsData(
    userId: string, 
    dateRange?: ExportRequest['dateRange'],
    includeDeleted: boolean = false
  ): Promise<ItemData[]> {
    // Mock implementation
    return [
      {
        id: 'item-1',
        groupId: 'group-1',
        name: 'Milk',
        category: 'Dairy',
        quantity: 2,
        notes: 'Organic preferred',
        status: 'purchased',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
        createdBy: userId,
      },
    ];
  }

  /**
   * Collect purchases data
   */
  private async collectPurchasesData(userId: string, dateRange?: ExportRequest['dateRange']): Promise<PurchaseData[]> {
    // Mock implementation
    return [
      {
        id: 'purchase-1',
        groupId: 'group-1',
        items: ['item-1'],
        amount: 4.50,
        purchasedAt: '2024-01-12T00:00:00Z',
        splits: [
          { userId, amount: 2.25, percentage: 50 },
          { userId: 'user-2', amount: 2.25, percentage: 50 },
        ],
      },
    ];
  }

  /**
   * Collect messages data
   */
  private async collectMessagesData(
    userId: string,
    dateRange?: ExportRequest['dateRange'],
    includeDeleted: boolean = false
  ): Promise<MessageData[]> {
    // Mock implementation
    return [
      {
        id: 'message-1',
        groupId: 'group-1',
        content: 'I can pick up the milk',
        itemId: 'item-1',
        sentAt: '2024-01-11T00:00:00Z',
      },
    ];
  }

  /**
   * Collect activity logs data
   */
  private async collectActivityLogsData(userId: string, dateRange?: ExportRequest['dateRange']): Promise<ActivityLogData[]> {
    // Mock implementation
    return [
      {
        id: 'log-1',
        action: 'item_created',
        entityType: 'item',
        entityId: 'item-1',
        details: { name: 'Milk', category: 'Dairy' },
        timestamp: '2024-01-10T00:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      },
    ];
  }

  /**
   * Collect preferences data
   */
  private async collectPreferencesData(userId: string): Promise<PreferenceData> {
    // Mock implementation
    return {
      notifications: {
        email: true,
        push: false,
        mentions: true,
      },
      privacy: {
        shareActivity: false,
        allowAnalytics: true,
      },
      accessibility: {
        reducedMotion: false,
        highContrast: false,
      },
      language: 'en',
      timezone: 'UTC',
    };
  }

  /**
   * Generate export file
   */
  private async generateExportFile(
    exportId: string,
    userData: UserDataExport,
    format: 'json' | 'csv' | 'xml'
  ): Promise<{ filePath: string; fileSize: number; checksum: string }> {
    const filePath = `/tmp/exports/${exportId}`;
    
    switch (format) {
      case 'json':
        return this.generateJSONExport(filePath, userData);
      case 'csv':
        return this.generateCSVExport(filePath, userData);
      case 'xml':
        return this.generateXMLExport(filePath, userData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate JSON export
   */
  private async generateJSONExport(
    filePath: string,
    userData: UserDataExport
  ): Promise<{ filePath: string; fileSize: number; checksum: string }> {
    const jsonData = JSON.stringify(userData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    
    // Check size limit
    if (buffer.length > DataExportService.MAX_EXPORT_SIZE) {
      throw new Error('Export data exceeds maximum size limit');
    }

    // Write to file (in real implementation)
    // await fs.writeFile(`${filePath}.json`, buffer);
    
    const checksum = createHash('sha256').update(buffer).digest('hex');
    
    return {
      filePath: `${filePath}.json`,
      fileSize: buffer.length,
      checksum,
    };
  }

  /**
   * Generate CSV export
   */
  private async generateCSVExport(
    filePath: string,
    userData: UserDataExport
  ): Promise<{ filePath: string; fileSize: number; checksum: string }> {
    // Create ZIP archive with multiple CSV files
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = createWriteStream(`${filePath}.zip`);
    
    archive.pipe(output);

    // Add CSV files for each data category
    if (userData.profile) {
      const profileCSV = this.convertToCSV([userData.profile]);
      archive.append(profileCSV, { name: 'profile.csv' });
    }

    if (userData.groups) {
      const groupsCSV = this.convertToCSV(userData.groups);
      archive.append(groupsCSV, { name: 'groups.csv' });
    }

    if (userData.items) {
      const itemsCSV = this.convertToCSV(userData.items);
      archive.append(itemsCSV, { name: 'items.csv' });
    }

    if (userData.purchases) {
      const purchasesCSV = this.convertToCSV(userData.purchases);
      archive.append(purchasesCSV, { name: 'purchases.csv' });
    }

    if (userData.messages) {
      const messagesCSV = this.convertToCSV(userData.messages);
      archive.append(messagesCSV, { name: 'messages.csv' });
    }

    if (userData.activityLogs) {
      const logsCSV = this.convertToCSV(userData.activityLogs);
      archive.append(logsCSV, { name: 'activity_logs.csv' });
    }

    await archive.finalize();

    // Calculate file size and checksum (mock)
    const fileSize = 1024; // Mock size
    const checksum = createHash('sha256').update('mock-data').digest('hex');

    return {
      filePath: `${filePath}.zip`,
      fileSize,
      checksum,
    };
  }

  /**
   * Generate XML export
   */
  private async generateXMLExport(
    filePath: string,
    userData: UserDataExport
  ): Promise<{ filePath: string; fileSize: number; checksum: string }> {
    const xmlData = this.convertToXML(userData);
    const buffer = Buffer.from(xmlData, 'utf8');
    
    if (buffer.length > DataExportService.MAX_EXPORT_SIZE) {
      throw new Error('Export data exceeds maximum size limit');
    }

    const checksum = createHash('sha256').update(buffer).digest('hex');
    
    return {
      filePath: `${filePath}.xml`,
      fileSize: buffer.length,
      checksum,
    };
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(userData: UserDataExport): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<export>\n';
    
    // Add export info
    xml += '  <exportInfo>\n';
    xml += `    <userId>${userData.exportInfo.userId}</userId>\n`;
    xml += `    <email>${userData.exportInfo.email}</email>\n`;
    xml += `    <exportedAt>${userData.exportInfo.exportedAt}</exportedAt>\n`;
    xml += `    <format>${userData.exportInfo.format}</format>\n`;
    xml += '  </exportInfo>\n';

    // Add data sections
    Object.entries(userData).forEach(([key, value]) => {
      if (key !== 'exportInfo' && value) {
        xml += `  <${key}>\n`;
        if (Array.isArray(value)) {
          value.forEach(item => {
            xml += '    <item>\n';
            Object.entries(item).forEach(([prop, val]) => {
              xml += `      <${prop}>${this.escapeXML(String(val))}</${prop}>\n`;
            });
            xml += '    </item>\n';
          });
        } else {
          Object.entries(value).forEach(([prop, val]) => {
            xml += `    <${prop}>${this.escapeXML(String(val))}</${prop}>\n`;
          });
        }
        xml += `  </${key}>\n`;
      }
    });

    xml += '</export>';
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Update export status
   */
  private updateExportStatus(
    exportId: string,
    status: ExportResult['status'],
    updates: Partial<ExportResult> = {}
  ): void {
    const result = this.exportResults.get(exportId);
    if (result) {
      Object.assign(result, { status, ...updates });
      this.exportResults.set(exportId, result);
    }
  }

  /**
   * Generate unique export ID
   */
  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Clean up expired exports
   */
  cleanupExpiredExports(): void {
    const now = new Date();
    
    for (const [exportId, result] of this.exportResults.entries()) {
      if (result.expiresAt < now) {
        this.exportResults.delete(exportId);
        this.exportRequests.delete(exportId);
        
        // Delete export file (in real implementation)
        // fs.unlink(result.filePath).catch(console.error);
      }
    }
  }

  /**
   * Delete user data (for account deletion)
   */
  async deleteUserData(userId: string, verificationToken: string): Promise<{
    success: boolean;
    deletedCategories: DataCategory[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const deletedCategories: DataCategory[] = [];

    try {
      // Verify deletion token
      if (!this.verifyDeletionToken(userId, verificationToken)) {
        throw new Error('Invalid verification token');
      }

      // Delete user profile
      try {
        // await db.user.delete({ where: { id: userId } });
        deletedCategories.push('profile');
      } catch (error) {
        errors.push('Failed to delete profile data');
      }

      // Delete user messages
      try {
        // await db.message.deleteMany({ where: { senderId: userId } });
        deletedCategories.push('messages');
      } catch (error) {
        errors.push('Failed to delete message data');
      }

      // Delete user activity logs
      try {
        // await db.activityLog.deleteMany({ where: { userId } });
        deletedCategories.push('activity_logs');
      } catch (error) {
        errors.push('Failed to delete activity logs');
      }

      // Remove user from groups (but keep group data)
      try {
        // await db.groupMember.deleteMany({ where: { userId } });
        deletedCategories.push('groups');
      } catch (error) {
        errors.push('Failed to remove from groups');
      }

      return {
        success: errors.length === 0,
        deletedCategories,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        deletedCategories,
        errors,
      };
    }
  }

  /**
   * Verify deletion token
   */
  private verifyDeletionToken(userId: string, token: string): boolean {
    // In real implementation, verify the token was sent via email
    // and is still valid
    return token.length > 0;
  }
}

// Global data export service instance
export const dataExportService = new DataExportService();

// Clean up expired exports every 6 hours
if (typeof window === 'undefined') {
  setInterval(() => {
    dataExportService.cleanupExpiredExports();
  }, 6 * 60 * 60 * 1000);
}