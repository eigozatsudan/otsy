/**
 * Validation utilities for user profile fields
 */

// Valid role enum values
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

// Valid subscription tier enum values
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

/**
 * Validates phone number format (Japanese format)
 * @param phone - Phone number string to validate
 * @returns boolean indicating if phone number is valid
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Japanese phone number patterns
  const phoneRegex = /^(\+81|0)[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{3,4}$/;
  
  // Remove spaces and hyphens for validation
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Check basic format
  if (!phoneRegex.test(cleanPhone)) {
    return false;
  }

  // Additional length checks
  if (cleanPhone.startsWith('+81')) {
    return cleanPhone.length >= 12 && cleanPhone.length <= 15;
  } else if (cleanPhone.startsWith('0')) {
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  return false;
}

/**
 * Validates user role against allowed enum values
 * @param role - Role string to validate
 * @returns boolean indicating if role is valid
 */
export function validateUserRole(role: string): boolean {
  if (!role || typeof role !== 'string') {
    return false;
  }

  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Validates subscription tier against allowed enum values
 * @param tier - Subscription tier string to validate
 * @returns boolean indicating if tier is valid
 */
export function validateSubscriptionTier(tier: string): boolean {
  if (!tier || typeof tier !== 'string') {
    return false;
  }

  return Object.values(SubscriptionTier).includes(tier as SubscriptionTier);
}

/**
 * Validates name fields (first_name, last_name)
 * @param name - Name string to validate
 * @returns boolean indicating if name is valid
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Name should be 1-50 characters, allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s'-]{1,50}$/;
  
  return nameRegex.test(name.trim());
}

/**
 * Validates display name
 * @param displayName - Display name string to validate
 * @returns boolean indicating if display name is valid
 */
export function validateDisplayName(displayName: string): boolean {
  if (!displayName || typeof displayName !== 'string') {
    return false;
  }

  // Display name should be 1-100 characters, allow most characters except control characters
  const displayNameRegex = /^[^\x00-\x1F\x7F]{1,100}$/;
  
  return displayNameRegex.test(displayName.trim());
}