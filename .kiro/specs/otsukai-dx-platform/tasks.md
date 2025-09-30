# Implementation Plan

- [x] 1. Remove legacy dependencies and clean up codebase
  - Remove Stripe payment integration and all payment-related dependencies
  - Delete KYC verification system and eKYC-related code
  - Remove location tracking and GPS-related functionality
  - Clean up shopper/admin applications and consolidate to single web app
  - Remove subscription and matching system components
  - Update environment variables to remove payment/KYC/location keys
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 2. Create new privacy-minimal database schema
  - Design new database schema with minimal PII collection (email + display_name only)
  - Create groups table with invite code generation
  - Implement group_members table with owner/member roles
  - Create items table for collaborative shopping lists
  - Design purchases and purchase_items tables for cost tracking
  - Implement splits table for cost distribution calculations
  - Create messages table for group communication and item threads
  - Add ads_impressions table for minimal ad tracking
  - Write Prisma migrations to transition from old schema
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 3. Implement group management system
  - Create group creation API with name, description, and invite code generation
  - Implement 12-character alphanumeric invite code generation with uniqueness validation
  - Build group joining functionality using invite codes or QR codes
  - Create group member management with owner/member role permissions
  - Implement group leaving functionality with ownership transfer logic
  - Add group settings and member management endpoints
  - Write unit tests for group creation, joining, and permission logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 4. Build collaborative shopping list management
  - Create item creation API with name, category, quantity, notes, and optional images
  - Implement item status management (todo, purchased, cancelled)
  - Build item editing functionality accessible to all group members
  - Create item categorization and filtering system
  - Implement item image upload with S3 signed URLs and PII warnings
  - Add item history tracking for purchase status changes
  - Write tests for item CRUD operations and status transitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement purchase recording and receipt management
  - Create purchase recording API linking to shopping list items
  - Implement receipt image upload with PII exposure warnings
  - Build purchase-item relationship tracking with quantities
  - Create purchase history and audit trail
  - Implement receipt image storage with EXIF data removal
  - Add purchase editing and deletion functionality
  - Write tests for purchase recording and receipt handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 6. Build cost splitting calculation engine
  - Implement equal split algorithm with proper remainder distribution
  - Create quantity-based split calculation with proportional distribution
  - Build custom split functionality with percentage or fixed amount input
  - Implement split validation to ensure 100% allocation
  - Create split result storage and retrieval system
  - Add split recalculation when purchase details change
  - Write comprehensive unit tests for all splitting algorithms including edge cases
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 7. Create group communication system
  - Implement group chat functionality with text and image messages
  - Build item-specific threaded discussions linked to shopping items
  - Create @mention functionality with notification triggers
  - Implement message history and pagination
  - Add image attachment support for chat messages
  - Create real-time message delivery using Server-Sent Events
  - Write tests for chat functionality and threading
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 8. Implement privacy-first user authentication
  - Create simplified user registration with email and display_name only
  - Implement JWT-based authentication without PII collection
  - Build password reset functionality using email-only identification
  - Create user profile management limited to display_name and avatar
  - Implement account deletion with data cleanup
  - Add session management with secure token handling
  - Write tests for authentication flows and privacy compliance
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 9. Build non-intrusive advertising system
  - Create ad slot components for list_top and detail_bottom placements
  - Implement one-ad-per-screen display logic with rotation
  - Build ad impression logging with minimal user tracking
  - Create ad content management system for static creatives
  - Implement ad frequency control and display rules
  - Add ad reporting dashboard for administrators
  - Write tests for ad display logic and impression tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 10. Create mobile-optimized web application
  - Set up single Next.js PWA application replacing multiple apps
  - Implement golden ratio and silver ratio design system with Tailwind CSS
  - Create responsive layouts using Fibonacci spacing (8, 13, 21, 34, 55px)
  - Build mobile-first components with 14-16sp typography
  - Implement touch-friendly interfaces with 44px minimum touch targets
  - Add subtle animations under 200ms for responsiveness
  - Create offline support for cached group data viewing
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 11. Implement group dashboard and navigation
  - Create group selection and switching interface
  - Build group overview dashboard with recent activity
  - Implement invite link and QR code generation/sharing
  - Create member management interface for group owners
  - Add group settings and preferences management
  - Build group activity feed and notifications
  - Write tests for group navigation and management features
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 12. Build shopping list interface with golden ratio design
  - Create item list view with golden ratio card proportions (1:1.618)
  - Implement item addition form with category selection
  - Build item editing interface with status toggle functionality
  - Create category filtering and search functionality
  - Implement drag-and-drop reordering for items
  - Add bulk item operations (mark multiple as purchased/cancelled)
  - Integrate ad slot component at list top with frequency control
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.1, 7.2_

- [x] 13. Create purchase recording and cost splitting interface
  - Build purchase recording modal with item selection checkboxes
  - Implement receipt image upload with PII warning display
  - Create cost splitting interface with rule selection (equal/quantity/custom)
  - Build split result preview and confirmation interface
  - Implement settlement summary showing who owes whom
  - Add purchase history view with detailed breakdowns
  - Integrate ad slot component at modal bottom
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.3, 7.4_

- [x] 14. Implement group chat and threaded discussions
  - Create group chat interface with message history
  - Build item-specific thread switching functionality
  - Implement @mention autocomplete and notification system
  - Add image attachment support with upload progress
  - Create message status indicators (sent, delivered, read)
  - Build chat search and filtering functionality
  - Write tests for real-time messaging and threading
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 15. Create administrative oversight interface
  - Build admin dashboard with platform usage metrics
  - Implement content moderation tools for reported messages/images
  - Create user management interface with account suspension capabilities
  - Build ad performance monitoring and creative management
  - Implement system health monitoring and error tracking
  - Add audit logging for administrative actions
  - Write tests for admin functionality and access control
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 16. Implement accessibility and inclusive design
  - Add ARIA labels and descriptions for all interactive elements
  - Implement keyboard navigation for all functionality
  - Ensure WCAG AA color contrast compliance (4.5:1 ratio)
  - Create screen reader friendly form validation and error messages
  - Add focus indicators for keyboard navigation
  - Implement dynamic content announcements for screen readers
  - Test with assistive technologies and fix accessibility issues
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 17. Set up real-time updates with Server-Sent Events
  - Implement SSE endpoints for group activity updates
  - Create client-side SSE connection management
  - Build real-time item status updates across group members
  - Implement real-time message delivery for chat
  - Add real-time purchase notifications and split calculations
  - Create connection recovery and offline handling
  - Write tests for real-time functionality and connection handling
  - _Requirements: 2.2, 2.5, 3.5, 4.5, 5.6_

- [ ] 18. Create comprehensive testing suite
  - Set up Playwright for end-to-end testing of group workflows
  - Create test fixtures for users, groups, items, and purchases
  - Build group creation and management test scenarios
  - Implement shopping list collaboration test flows
  - Add cost splitting calculation test cases with edge scenarios
  - Create chat and threading functionality tests
  - Set up CI/CD pipeline with automated testing
  - _Requirements: All requirements need comprehensive testing_

- [ ] 19. Implement security and privacy measures
  - Add rate limiting for API endpoints to prevent abuse
  - Implement input validation and sanitization for all user inputs
  - Create EXIF data removal for uploaded images
  - Add CORS configuration for production security
  - Implement secure session management and token handling
  - Create data export functionality for user privacy compliance
  - Write security tests and vulnerability assessments
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 20. Set up production deployment and monitoring
  - Create Docker containerization for the single web application
  - Set up production database with proper indexing and performance optimization
  - Implement health checks and monitoring endpoints
  - Configure CDN for image delivery and static assets
  - Set up error tracking and performance monitoring
  - Create backup and disaster recovery procedures
  - Write deployment documentation and runbooks
  - _Requirements: All requirements need production deployment_