# Privacy-First Authentication System

This module implements a privacy-first authentication system for the Otsukai DX platform, designed to collect minimal personal information while providing secure user management.

## 🔒 Privacy Principles

### ✅ What We Collect (Minimal PII)
- **Email address** - For account identification and password reset
- **Display name** - For user identification within groups
- **Avatar URL** - Optional profile picture (user-provided URL only)

### ❌ What We DON'T Collect
- ❌ Phone numbers
- ❌ Physical addresses  
- ❌ Government IDs or KYC information
- ❌ Payment information
- ❌ Location data or GPS tracking
- ❌ Social media profiles
- ❌ Detailed user profiling data

## 🚀 Features

### Core Authentication
- **Secure Registration** - Email + display name + strong password only
- **JWT-based Authentication** - Stateless tokens with short expiration
- **Refresh Token System** - Secure token renewal without re-authentication
- **Password Security** - bcrypt hashing with high salt rounds
- **Account Deletion** - Complete data removal with group preservation

### Privacy Features
- **Email-only Password Reset** - No additional PII required
- **Anonymous Error Messages** - Don't reveal if accounts exist
- **Data Minimization** - Only essential data stored
- **Group Ownership Transfer** - Preserve group functionality after account deletion
- **Secure Session Management** - Short-lived access tokens

## 📡 API Endpoints

### Authentication
```
POST   /auth/register           # Register new account
POST   /auth/login              # Login with email/password
POST   /auth/refresh            # Refresh access token
POST   /auth/logout             # Logout (client-side)
```

### Profile Management
```
GET    /auth/profile            # Get user profile
PUT    /auth/profile            # Update display name/avatar
PUT    /auth/password           # Change password
```

### Account Recovery & Deletion
```
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password with token
DELETE /auth/account            # Delete account permanently
```

## 🔧 Usage Examples

### Registration
```typescript
POST /auth/register
{
  "email": "user@example.com",
  "display_name": "John Doe",
  "password": "SecurePassword123!"
}

Response:
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Login
```typescript
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: Same as registration
```

### Profile Update
```typescript
PUT /auth/profile
Authorization: Bearer <access_token>
{
  "display_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### Password Change
```typescript
PUT /auth/password
Authorization: Bearer <access_token>
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

### Account Deletion
```typescript
DELETE /auth/account
Authorization: Bearer <access_token>

Response:
{
  "message": "Account deleted successfully. Group data has been preserved."
}
```

## 🛡️ Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

### Token Security
- **Access tokens**: 15-minute expiration
- **Refresh tokens**: 7-day expiration
- **JWT secrets**: Separate secrets for access and refresh tokens
- **Stateless design**: No server-side session storage

### Data Protection
- **bcrypt hashing**: 12 salt rounds for password security
- **Email normalization**: Lowercase storage for consistency
- **Input validation**: Comprehensive validation using class-validator
- **Error handling**: Privacy-preserving error messages

## 🗄️ Database Schema

The system uses a minimal User model:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  display_name String
  password_hash String
  avatar_url   String?
  created_at   DateTime @default(now())

  // Relations for group functionality
  created_groups   Group[]       @relation("GroupCreator")
  group_memberships GroupMember[]
  messages         Message[]     @relation("MessageAuthor")
  // ... other minimal relations
}
```

## 🧪 Testing

Comprehensive test suite with 18 test cases covering:

- **Registration flows** - Success and conflict scenarios
- **Login validation** - Credential verification
- **Token management** - Refresh and validation
- **Profile operations** - Updates and retrieval
- **Password security** - Change and validation
- **Account deletion** - Data cleanup and group preservation
- **Privacy compliance** - Error message privacy

Run tests:
```bash
npm test -- --testPathPattern=privacy-auth.service.spec.ts
```

## 🔄 Account Deletion Process

When a user deletes their account:

1. **Group Ownership Transfer** - Groups created by the user are transferred to the oldest member
2. **Group Cleanup** - Empty groups (no other members) are deleted
3. **Message Anonymization** - User messages are deleted to preserve privacy
4. **Purchase Anonymization** - Purchase records are anonymized but preserved for group cost tracking
5. **Complete User Removal** - All personal data is permanently deleted

## 🚨 Privacy Compliance

### GDPR Compliance
- ✅ **Data minimization** - Only essential data collected
- ✅ **Right to deletion** - Complete account removal
- ✅ **Data portability** - Profile data easily exportable
- ✅ **Consent-based** - Explicit user consent for data collection
- ✅ **Purpose limitation** - Data used only for stated purposes

### Security Best Practices
- ✅ **Encryption at rest** - Database encryption
- ✅ **Secure transmission** - HTTPS/TLS for all communications
- ✅ **Access controls** - JWT-based authorization
- ✅ **Audit logging** - Security event tracking
- ✅ **Regular security updates** - Dependency management

## 🔮 Future Enhancements

- **Two-Factor Authentication** - Optional 2FA for enhanced security
- **OAuth Integration** - Social login without PII collection
- **Account Export** - GDPR-compliant data export
- **Security Notifications** - Login alerts and security events
- **Advanced Password Policies** - Configurable password requirements