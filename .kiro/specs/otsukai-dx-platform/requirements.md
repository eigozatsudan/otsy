# Requirements Document

## Introduction

Otsukai DX Pivot is a household and friend group collaborative shopping management application. The platform enables groups of family members or friends to collectively manage shopping lists, coordinate purchases, and fairly split costs. All users are equal participants in their groups, with no service provider relationship. The system emphasizes privacy by collecting minimal personal information (email and display name only) and generates revenue through non-intrusive advertising rather than payment processing fees.

## Requirements

### Requirement 1: Group Creation and Management

**User Story:** As a family member or friend, I want to create and manage shopping groups, so that I can coordinate purchases with people I trust.

#### Acceptance Criteria

1. WHEN a user wants to create a group THEN they SHALL be able to create a group with a name and optional description
2. WHEN a group is created THEN the system SHALL generate a unique 12-character alphanumeric invite code
3. WHEN a user wants to invite others THEN they SHALL be able to share an invite link or QR code containing the invite code
4. WHEN someone uses an invite code THEN they SHALL be able to join the group as a member
5. WHEN a user creates a group THEN they SHALL become the group owner with permissions to edit group details and remove members
6. WHEN a group member wants to leave THEN they SHALL be able to leave the group at any time
7. IF a group owner leaves THEN ownership SHALL transfer to the longest-standing member

### Requirement 2: Collaborative Shopping List Management

**User Story:** As a group member, I want to add items to our shared shopping list and see what others have added, so that we can coordinate our shopping needs.

#### Acceptance Criteria

1. WHEN a group member adds an item THEN it SHALL include name, category, quantity, and optional notes and image
2. WHEN an item is added THEN all group members SHALL see it in the shared list immediately
3. WHEN viewing the shopping list THEN items SHALL be organized by category and show status (todo, purchased, cancelled)
4. WHEN a group member wants to modify an item THEN they SHALL be able to edit any item in the list
5. WHEN an item is marked as purchased THEN it SHALL show who purchased it and when
6. WHEN viewing purchased items THEN group members SHALL see the purchase history and associated costs
7. IF an item is no longer needed THEN any member SHALL be able to mark it as cancelled

### Requirement 3: Purchase Recording and Receipt Management

**User Story:** As a group member who made purchases, I want to record what I bought and how much I spent, so that costs can be fairly distributed among the group.

#### Acceptance Criteria

1. WHEN a member purchases items THEN they SHALL be able to record the total amount spent
2. WHEN recording a purchase THEN they SHALL select which items from the list were purchased and in what quantities
3. WHEN recording a purchase THEN they SHALL optionally upload a receipt image with PII warning displayed
4. WHEN a receipt image is uploaded THEN the system SHALL store it securely and warn about potential personal information exposure
5. WHEN a purchase is recorded THEN it SHALL be linked to the specific items and marked as purchased
6. WHEN multiple items are purchased together THEN they SHALL be grouped as a single purchase transaction
7. IF receipt processing is available THEN the system MAY suggest automatic extraction of amounts and items

### Requirement 4: Cost Splitting and Settlement Calculation

**User Story:** As a group member, I want to see how costs should be split fairly among participants, so that everyone pays their appropriate share.

#### Acceptance Criteria

1. WHEN a purchase is recorded THEN the system SHALL calculate cost splits based on the selected splitting method
2. WHEN splitting costs THEN group members SHALL choose between equal split, quantity-based split, or custom percentages
3. WHEN using equal split THEN costs SHALL be divided evenly among all group members with proper rounding
4. WHEN using quantity-based split THEN costs SHALL be proportional to each member's share of purchased quantities
5. WHEN using custom split THEN members SHALL be able to set specific percentages or amounts for each person
6. WHEN calculations are complete THEN the system SHALL show who owes whom and how much
7. WHEN viewing settlement THEN members SHALL see a clear summary of debts and credits with settlement suggestions
8. IF rounding creates discrepancies THEN the system SHALL distribute remainder cents to members with the lowest user IDs

### Requirement 5: Group Communication and Item Discussions

**User Story:** As a group member, I want to communicate with my group about shopping items and general coordination, so that we can make informed decisions together.

#### Acceptance Criteria

1. WHEN group members want to communicate THEN they SHALL have access to a group chat feature
2. WHEN discussing specific items THEN members SHALL be able to create threaded conversations linked to individual items
3. WHEN sending messages THEN members SHALL be able to include text and images
4. WHEN mentioning other members THEN they SHALL receive notifications using @username syntax
5. WHEN viewing item threads THEN members SHALL see all discussions related to that specific item
6. WHEN new messages are posted THEN relevant members SHALL receive push notifications
7. IF a member is mentioned THEN they SHALL receive a specific mention notification

### Requirement 6: Privacy-First User Management

**User Story:** As a user concerned about privacy, I want to use the service with minimal personal information sharing, so that my privacy is protected.

#### Acceptance Criteria

1. WHEN registering THEN users SHALL only provide email address and display name
2. WHEN using the service THEN the system SHALL NOT collect payment information, physical addresses, phone numbers, or government IDs
3. WHEN using the service THEN the system SHALL NOT track precise location or require location permissions
4. WHEN uploading images THEN the system SHALL warn users about potential PII in receipts and photos
5. WHEN data is stored THEN it SHALL be limited to email, display name, group memberships, and shopping activity
6. WHEN users want to delete their account THEN all personal data SHALL be removed while preserving group functionality
7. IF users share personal information in chats THEN it SHALL be their explicit choice with appropriate warnings

### Requirement 7: Non-Intrusive Advertising Revenue

**User Story:** As a platform operator, I want to generate revenue through advertising while maintaining a good user experience, so that the service can be sustainable without charging users.

#### Acceptance Criteria

1. WHEN users view shopping lists THEN there SHALL be one native advertisement slot at the top of the list
2. WHEN users view item details or purchase modals THEN there SHALL be one banner advertisement at the bottom
3. WHEN displaying ads THEN only one advertisement SHALL be visible per screen at any time
4. WHEN users scroll or navigate THEN ads MAY change but SHALL maintain the one-per-screen limit
5. WHEN serving ads THEN the system SHALL NOT use cross-site tracking or detailed user profiling
6. WHEN logging ad impressions THEN it SHALL record minimal data without personal tracking across groups
7. IF ad content is inappropriate THEN users SHALL be able to report it for review

### Requirement 8: Mobile-Optimized User Experience

**User Story:** As a mobile user, I want the application to work smoothly on my phone with an intuitive interface, so that I can manage shopping on the go.

#### Acceptance Criteria

1. WHEN using the application THEN it SHALL be optimized for mobile devices with touch-friendly interfaces
2. WHEN viewing content THEN it SHALL use golden ratio and silver ratio proportions for visual harmony
3. WHEN interacting with elements THEN they SHALL have appropriate sizing for finger navigation
4. WHEN viewing lists and cards THEN they SHALL follow consistent spacing using Fibonacci-based scales (8, 13, 21, 34, 55px)
5. WHEN reading text THEN font sizes SHALL be optimized for mobile readability (14-16sp base size)
6. WHEN using the interface THEN animations SHALL be subtle and under 200ms for responsiveness
7. IF the device supports it THEN the application SHALL work offline for viewing cached data

### Requirement 9: Administrative Oversight and Content Moderation

**User Story:** As a platform administrator, I want to monitor the platform for inappropriate content and ensure smooth operation, so that users have a safe and reliable experience.

#### Acceptance Criteria

1. WHEN administrators access the admin panel THEN they SHALL see platform usage metrics and health indicators
2. WHEN inappropriate content is reported THEN administrators SHALL be able to review and take action
3. WHEN managing groups THEN administrators SHALL be able to view group activity without accessing private messages
4. WHEN users violate terms THEN administrators SHALL be able to suspend accounts with proper documentation
5. WHEN technical issues occur THEN administrators SHALL have access to system logs and error tracking
6. WHEN reviewing ad performance THEN administrators SHALL see impression data without user-specific tracking
7. IF spam or abuse is detected THEN the system SHALL flag it for administrative review

### Requirement 10: Accessibility and Inclusive Design

**User Story:** As a user with accessibility needs, I want the application to be usable with assistive technologies, so that I can participate fully in group shopping activities.

#### Acceptance Criteria

1. WHEN using screen readers THEN all interface elements SHALL have appropriate labels and descriptions
2. WHEN navigating with keyboard THEN all functionality SHALL be accessible without mouse interaction
3. WHEN viewing content THEN color contrast SHALL meet WCAG AA standards (4.5:1 for normal text)
4. WHEN interacting with forms THEN error messages SHALL be clearly associated with relevant fields
5. WHEN using the interface THEN focus indicators SHALL be clearly visible for keyboard navigation
6. WHEN content updates dynamically THEN screen readers SHALL be notified of important changes
7. IF users have motor difficulties THEN touch targets SHALL be at least 44px in size with adequate spacing