# Requirements Document

## Introduction

The current authentication system is attempting to use user profile fields that don't exist in the database schema, causing TypeScript compilation errors. This feature will add the missing user profile fields to the User model to support comprehensive user management and authentication functionality.

## Requirements

### Requirement 1

**User Story:** As a user, I want to provide my personal information during registration, so that the system can personalize my experience and enable proper user identification.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL accept and store their first name
2. WHEN a user registers THEN the system SHALL accept and store their last name  
3. WHEN a user registers THEN the system SHALL accept and store their phone number
4. WHEN user profile data is created THEN the system SHALL validate the format of phone numbers
5. WHEN user profile data is created THEN the system SHALL validate that names contain only valid characters

### Requirement 2

**User Story:** As a system administrator, I want to manage user roles and subscription tiers, so that I can control access levels and billing appropriately.

#### Acceptance Criteria

1. WHEN a user is created THEN the system SHALL assign a default role of "user"
2. WHEN a user is created THEN the system SHALL assign a default subscription tier of "free"
3. WHEN an admin updates user roles THEN the system SHALL validate the role is from allowed values
4. WHEN an admin updates subscription tiers THEN the system SHALL validate the tier is from allowed values
5. IF a user has admin privileges THEN the system SHALL allow role modifications for other users

### Requirement 3

**User Story:** As a system, I want to track user activity timestamps, so that I can monitor engagement and implement security features.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL update their last_active_at timestamp
2. WHEN a user profile is modified THEN the system SHALL update the updated_at timestamp
3. WHEN querying user data THEN the system SHALL return accurate timestamp information
4. WHEN a user is created THEN the system SHALL set both created_at and updated_at to the current time

### Requirement 4

**User Story:** As a developer, I want the authentication service to work without TypeScript errors, so that the application can compile and run successfully.

#### Acceptance Criteria

1. WHEN the application compiles THEN there SHALL be no TypeScript errors related to missing User model fields
2. WHEN the auth service queries user data THEN all referenced fields SHALL exist in the database schema
3. WHEN user registration occurs THEN all DTO fields SHALL map to valid database columns
4. WHEN user profile queries execute THEN all selected fields SHALL be available in the User model