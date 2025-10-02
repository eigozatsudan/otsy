import {
  validatePhoneNumber,
  validateUserRole,
  validateSubscriptionTier,
  validateName,
  validateDisplayName,
  UserRole,
  SubscriptionTier,
} from './validation.utils';

describe('Validation Utils', () => {
  describe('validatePhoneNumber', () => {
    it('should validate Japanese phone numbers correctly', () => {
      // Valid formats
      expect(validatePhoneNumber('090-1234-5678')).toBe(true);
      expect(validatePhoneNumber('09012345678')).toBe(true);
      expect(validatePhoneNumber('03-1234-5678')).toBe(true);
      expect(validatePhoneNumber('0312345678')).toBe(true);
      expect(validatePhoneNumber('+81-90-1234-5678')).toBe(true);
      expect(validatePhoneNumber('+819012345678')).toBe(true);
      
      // Invalid formats
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abc-def-ghij')).toBe(false);
      expect(validatePhoneNumber('090-123-456')).toBe(false);
      expect(validatePhoneNumber('090-1234-56789')).toBe(false);
      expect(validatePhoneNumber(null)).toBe(false);
      expect(validatePhoneNumber(undefined)).toBe(false);
    });
  });

  describe('validateUserRole', () => {
    it('should validate user roles correctly', () => {
      // Valid roles
      expect(validateUserRole(UserRole.USER)).toBe(true);
      expect(validateUserRole(UserRole.ADMIN)).toBe(true);
      expect(validateUserRole(UserRole.MODERATOR)).toBe(true);
      expect(validateUserRole('user')).toBe(true);
      expect(validateUserRole('admin')).toBe(true);
      expect(validateUserRole('moderator')).toBe(true);
      
      // Invalid roles
      expect(validateUserRole('')).toBe(false);
      expect(validateUserRole('invalid')).toBe(false);
      expect(validateUserRole('USER')).toBe(false); // Case sensitive
      expect(validateUserRole('superuser')).toBe(false);
      expect(validateUserRole(null)).toBe(false);
      expect(validateUserRole(undefined)).toBe(false);
    });
  });

  describe('validateSubscriptionTier', () => {
    it('should validate subscription tiers correctly', () => {
      // Valid tiers
      expect(validateSubscriptionTier(SubscriptionTier.FREE)).toBe(true);
      expect(validateSubscriptionTier(SubscriptionTier.PREMIUM)).toBe(true);
      expect(validateSubscriptionTier(SubscriptionTier.ENTERPRISE)).toBe(true);
      expect(validateSubscriptionTier('free')).toBe(true);
      expect(validateSubscriptionTier('premium')).toBe(true);
      expect(validateSubscriptionTier('enterprise')).toBe(true);
      
      // Invalid tiers
      expect(validateSubscriptionTier('')).toBe(false);
      expect(validateSubscriptionTier('invalid')).toBe(false);
      expect(validateSubscriptionTier('FREE')).toBe(false); // Case sensitive
      expect(validateSubscriptionTier('basic')).toBe(false);
      expect(validateSubscriptionTier(null)).toBe(false);
      expect(validateSubscriptionTier(undefined)).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate names correctly', () => {
      // Valid names
      expect(validateName('John')).toBe(true);
      expect(validateName('田中')).toBe(true);
      expect(validateName('たなか')).toBe(true);
      expect(validateName('タナカ')).toBe(true);
      expect(validateName('John Doe')).toBe(true);
      expect(validateName("O'Connor")).toBe(true);
      expect(validateName('Jean-Pierre')).toBe(true);
      expect(validateName('山田 太郎')).toBe(true);
      
      // Invalid names
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
      expect(validateName('John123')).toBe(false);
      expect(validateName('John@Doe')).toBe(false);
      expect(validateName('A'.repeat(51))).toBe(false); // Too long
      expect(validateName(null)).toBe(false);
      expect(validateName(undefined)).toBe(false);
    });
  });

  describe('validateDisplayName', () => {
    it('should validate display names correctly', () => {
      // Valid display names
      expect(validateDisplayName('John Doe')).toBe(true);
      expect(validateDisplayName('田中太郎')).toBe(true);
      expect(validateDisplayName('User123')).toBe(true);
      expect(validateDisplayName('Cool_User')).toBe(true);
      expect(validateDisplayName('User@Company')).toBe(true);
      expect(validateDisplayName('🎉 Happy User')).toBe(true);
      
      // Invalid display names
      expect(validateDisplayName('')).toBe(false);
      expect(validateDisplayName('   ')).toBe(false);
      expect(validateDisplayName('A'.repeat(101))).toBe(false); // Too long
      expect(validateDisplayName('\x00invalid')).toBe(false); // Control character
      expect(validateDisplayName('\x1Finvalid')).toBe(false); // Control character
      expect(validateDisplayName(null)).toBe(false);
      expect(validateDisplayName(undefined)).toBe(false);
    });
  });
});