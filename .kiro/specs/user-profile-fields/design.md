# Design Document

## Overview

This design addresses the missing user profile fields in the Prisma User model that are causing TypeScript compilation errors in the authentication service. The solution involves extending the existing User schema with additional fields for personal information, role management, subscription tiers, and activity tracking.

## Architecture

### Database Schema Changes

The User model will be extended with the following fields:
- Personal information: `first_name`, `last_name`, `phone`
- System fields: `role`, `subscription_tier`, `last_active_at`, `updated_at`

### Migration Strategy

1. Create a new Prisma migration to add the missing fields
2. Set appropriate default values for existing users
3. Update the Prisma client types automatically
4. Ensure backward compatibility during the transition

## Components and Interfaces

### Updated User Model Schema

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password_hash     String
  display_name      String
  avatar_url        String?
  first_name        String?
  last_name         String?
  phone             String?
  role              String    @default("user")
  subscription_tier String    @default("free")
  last_active_at    DateTime?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  
  // Existing relations remain unchanged
  created_groups      Group[]       @relation("GroupCreator")
  group_memberships   GroupMember[]
  created_items       Item[]        @relation("ItemCreator")
  purchases           Purchase[]    @relation("PurchaseCreator")
  splits              Split[]
  messages            Message[]     @relation("MessageAuthor")
  push_subscriptions  PushSubscription[]
  notification_logs   NotificationLog[]
  ad_impressions      AdImpression[]

  @@map("users")
}
```

### Field Specifications

#### Personal Information Fields
- `first_name`: Optional string for user's first name
- `last_name`: Optional string for user's last name  
- `phone`: Optional string for phone number (will include validation)

#### System Fields
- `role`: String with default "user", enum values: "user", "admin", "moderator"
- `subscription_tier`: String with default "free", enum values: "free", "premium", "enterprise"
- `last_active_at`: Optional DateTime for tracking user activity
- `updated_at`: DateTime with @updatedAt directive for automatic updates

## Data Models

### User Registration DTO Updates

The existing RegisterUserDto should support the new optional fields:

```typescript
export class RegisterUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  display_name: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
```

### User Profile Response Model

```typescript
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  subscriptionTier: string;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Migration Error Handling
- Handle cases where existing users have null values for new fields
- Provide rollback capability if migration fails
- Validate data integrity after migration

### Validation Error Handling
- Phone number format validation with appropriate error messages
- Role and subscription tier validation against allowed enum values
- Handle cases where optional fields are provided but invalid

### Runtime Error Handling
- Graceful handling of missing optional fields in queries
- Proper error responses when required fields are missing
- Consistent error formatting across authentication endpoints

## Testing Strategy

### Unit Tests
- Test Prisma model field access and validation
- Test DTO validation for new optional fields
- Test auth service methods with new field mappings
- Test default value assignment for new users

### Integration Tests
- Test user registration with new optional fields
- Test user profile retrieval with all fields
- Test authentication flow with updated user model
- Test migration process with existing data

### Database Tests
- Verify migration creates all required fields
- Test default value assignment for existing records
- Verify foreign key relationships remain intact
- Test query performance with additional fields

### Validation Tests
- Test phone number format validation
- Test role and subscription tier enum validation
- Test optional field handling in various scenarios
- Test edge cases with null/undefined values

## Implementation Notes

### Migration Considerations
- The migration will add nullable fields initially to avoid breaking existing data
- Default values will be set at the database level for new records
- Existing users will have null values for optional personal information fields

### Performance Considerations
- Additional fields will have minimal impact on query performance
- Indexes may be added for frequently queried fields like `role` and `last_active_at`
- The `updated_at` field uses Prisma's @updatedAt directive for automatic updates

### Security Considerations
- Phone numbers will be stored as plain text but should be validated for format
- Role changes should be restricted to authorized users only
- Personal information fields are optional to respect user privacy preferences