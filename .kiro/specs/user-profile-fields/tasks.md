# Implementation Plan

- [x] 1. Update Prisma schema with missing user profile fields
  - Add first_name, last_name, phone fields as optional strings to User model
  - Add role field with default "user" value to User model
  - Add subscription_tier field with default "free" value to User model
  - Add last_active_at field as optional DateTime to User model
  - Add updated_at field with @updatedAt directive to User model
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.2, 3.4_

- [x] 2. Generate and run Prisma migration
  - Generate new Prisma migration for the schema changes
  - Review the generated migration SQL for correctness
  - Run the migration to update the database schema
  - Verify that Prisma client types are regenerated correctly
  - _Requirements: 4.2, 4.3_

- [x] 3. Update RegisterUserDto to support new optional fields
  - Add optional first_name field with string validation to RegisterUserDto
  - Add optional last_name field with string validation to RegisterUserDto
  - Add optional phone field with phone number validation to RegisterUserDto
  - Import and configure phone number validation decorator
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Fix auth service user registration method
  - Update user creation data object to include new optional fields from DTO
  - Update user creation select object to include all new fields
  - Fix TypeScript errors in registerUser method
  - _Requirements: 4.1, 4.3_

- [x] 5. Fix auth service getUserProfile method
  - Update user query select object to include all new fields
  - Update return object mapping to use correct field names
  - Fix TypeScript errors in getUserProfile method
  - _Requirements: 4.1, 4.2_

- [x] 6. Add user activity tracking to login method
  - Update validateUser method to set last_active_at timestamp on successful login
  - Ensure last_active_at is updated for both user and admin login flows
  - _Requirements: 3.1_

- [x] 7. Create validation utilities for new fields
  - Implement phone number format validation function
  - Implement role enum validation function
  - Implement subscription tier enum validation function
  - Add unit tests for validation utilities
  - _Requirements: 1.4, 1.5, 2.3, 2.4_

- [ ] 8. Update auth service tests
  - Fix existing auth service unit tests to work with new User model fields
  - Add tests for new optional fields in user registration
  - Add tests for getUserProfile method with new fields
  - Add tests for last_active_at timestamp updates
  - _Requirements: 4.1, 4.4_

- [ ] 9. Add integration tests for updated authentication flow
  - Test user registration with new optional fields
  - Test user login updates last_active_at timestamp
  - Test getUserProfile returns all expected fields
  - Test validation errors for invalid field values
  - _Requirements: 1.4, 1.5, 2.3, 2.4, 3.1_

- [ ] 10. Verify application compiles and runs without errors
  - Run TypeScript compilation to ensure no remaining errors
  - Start the application and verify it runs successfully
  - Test basic authentication endpoints to ensure functionality
  - _Requirements: 4.1_