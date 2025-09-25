# Requirements Document

## Introduction

Otsukai DX is a voice-enabled shopping service platform that connects users who need items purchased with shoppers who can fulfill those requests. The platform serves three main user types: end users (primarily busy families with children), shoppers (primarily mothers who can work during daytime hours), and administrators who manage the platform. The system emphasizes safety, transparency, and convenience through features like receipt verification, real-time communication, and flexible approval workflows.

## Requirements

### Requirement 1: Voice-to-Shopping List Conversion

**User Story:** As a busy parent, I want to describe what I need using natural language or voice input, so that I can quickly create a shopping list without manually typing each item.

#### Acceptance Criteria

1. WHEN a user provides voice or text input describing their needs THEN the system SHALL generate a structured shopping list using LLM processing
2. WHEN the system processes input like "I want to make oden. I have daikon and chikuwa. I don't need chrysanthemum greens" THEN it SHALL infer missing ingredients and create appropriate line items
3. WHEN generating the shopping list THEN the system SHALL include estimated price ranges for each item
4. WHEN the user wants to modify the generated list THEN they SHALL be able to add, remove, or change items through conversational input
5. IF the system cannot determine specific items from the input THEN it SHALL ask clarifying questions before finalizing the list

### Requirement 2: Dual Order Processing Modes

**User Story:** As a user, I want to choose between having control over each purchase decision or letting the shopper make decisions within my parameters, so that I can balance convenience with control based on my preferences.

#### Acceptance Criteria

1. WHEN creating an order THEN the user SHALL choose between "approval mode" and "delegate mode"
2. IF approval mode is selected THEN the shopper SHALL send photos and prices for each item and wait for user approval before purchasing
3. IF delegate mode is selected THEN the shopper SHALL purchase items that fall within the specified price ranges and substitution rules without waiting for approval
4. WHEN in delegate mode THEN the system SHALL allow users to set price ranges and substitution preferences for each item
5. WHEN a shopper cannot find an item or it exceeds the price range THEN they SHALL request approval regardless of the selected mode

### Requirement 3: Receipt Verification System

**User Story:** As a user, I want to verify what was actually purchased and at what price, so that I can ensure accuracy and build trust in the service.

#### Acceptance Criteria

1. WHEN placing an order THEN the user SHALL choose between "required receipt review" and "automatic processing"
2. WHEN a shopper completes shopping THEN they SHALL submit a photo of the receipt
3. IF the user selected "required receipt review" THEN payment SHALL be held until the user approves the receipt
4. IF the user selected "automatic processing" THEN payment SHALL be processed automatically after receipt submission
5. WHEN reviewing a receipt THEN the user SHALL be able to approve, reject, or request clarification
6. WHEN a receipt is rejected THEN the system SHALL initiate a refund process and allow communication between user and shopper

### Requirement 4: Real-time Order Tracking and Communication

**User Story:** As a user, I want to know the status of my order and communicate with my shopper, so that I can stay informed and provide additional instructions if needed.

#### Acceptance Criteria

1. WHEN an order is placed THEN the system SHALL show real-time status updates (new, accepted, shopping, purchased, en route, delivered)
2. WHEN a shopper accepts an order THEN both parties SHALL receive notifications
3. WHEN either party sends a message THEN the other SHALL receive a push notification
4. WHEN a shopper updates their status THEN the user SHALL receive an automatic notification
5. WHEN a shopper submits a receipt THEN the user SHALL be notified immediately if receipt review is required

### Requirement 5: Shopper Management and KYC

**User Story:** As a platform administrator, I want to verify shopper identities and manage their access to the platform, so that I can ensure user safety and service quality.

#### Acceptance Criteria

1. WHEN a shopper registers THEN they SHALL complete eKYC verification including ID document photos and selfie verification
2. WHEN KYC documents are submitted THEN the system SHALL assign a risk tier (L0, L1, L2, L-1) based on verification results
3. IF a shopper has risk tier L-1 or fails KYC THEN they SHALL be prevented from accepting orders
4. WHEN a shopper's rating falls below 4 stars THEN they SHALL be excluded from priority matching
5. WHEN administrators review KYC submissions THEN they SHALL be able to approve, reject, or request additional documentation

### Requirement 6: Payment Processing with Authorization Hold

**User Story:** As a user, I want my payment to be secure and only charged for what was actually purchased, so that I can trust the financial aspects of the service.

#### Acceptance Criteria

1. WHEN an order is confirmed THEN the system SHALL authorize payment for 120% of the estimated amount using Stripe
2. WHEN a receipt is approved or auto-processed THEN the system SHALL capture the actual purchase amount
3. IF the actual amount exceeds the estimate THEN the system SHALL request additional authorization before capturing
4. WHEN a refund is needed THEN administrators SHALL be able to process full or partial refunds through the admin interface
5. WHEN payment fails THEN the user SHALL be notified and given options to update their payment method

### Requirement 7: Subscription and Priority Matching

**User Story:** As a frequent user, I want priority access to shoppers and additional benefits, so that I can get faster service when I need it most.

#### Acceptance Criteria

1. WHEN a user subscribes THEN they SHALL receive priority matching with available shoppers
2. WHEN multiple orders are pending THEN subscribers' orders SHALL be shown to shoppers first
3. WHEN a subscriber wants to request a specific shopper THEN they SHALL be able to do so without additional fees
4. WHEN a subscriber places an order THEN they SHALL have access to time slot guarantees
5. IF a subscriber's order cannot be fulfilled within the guaranteed time THEN they SHALL receive service credits

### Requirement 8: Admin Dashboard and Monitoring

**User Story:** As a platform administrator, I want to monitor orders, process refunds, and manage users, so that I can ensure smooth platform operations and handle issues quickly.

#### Acceptance Criteria

1. WHEN administrators access the dashboard THEN they SHALL see real-time metrics including active orders, shopper availability, and revenue
2. WHEN an order requires intervention THEN administrators SHALL be able to view full order details including chat history and receipts
3. WHEN processing refunds THEN administrators SHALL be able to execute full or partial refunds with reason tracking
4. WHEN managing shoppers THEN administrators SHALL be able to view KYC status, ratings, and suspend accounts if needed
5. WHEN reviewing platform activity THEN administrators SHALL have access to audit logs showing all critical actions

### Requirement 9: Mobile-First User Experience

**User Story:** As a user, I want the service to work seamlessly on my mobile device, so that I can place orders and track progress while on the go.

#### Acceptance Criteria

1. WHEN accessing the platform on mobile THEN all core functions SHALL be optimized for touch interaction
2. WHEN using voice input THEN the system SHALL work with device microphones and provide visual feedback
3. WHEN receiving notifications THEN they SHALL appear as push notifications on mobile devices
4. WHEN viewing receipts or photos THEN they SHALL be clearly readable on mobile screens
5. WHEN the app is offline THEN users SHALL be able to view cached order status and receive notifications when connectivity returns

### Requirement 10: Safety and Quality Assurance

**User Story:** As a user, I want assurance that my shopper is trustworthy and that I'm protected if something goes wrong, so that I can use the service with confidence.

#### Acceptance Criteria

1. WHEN using the service for the first time THEN users SHALL be covered by a full money-back guarantee
2. WHEN there are quality issues with purchased items THEN users SHALL be able to request refunds or service credits
3. WHEN shoppers consistently receive poor ratings THEN they SHALL be automatically suspended from the platform
4. WHEN suspicious activity is detected THEN the system SHALL flag orders for administrative review
5. WHEN personal information is handled THEN it SHALL be protected according to privacy regulations and not shared between users and shoppers unnecessarily