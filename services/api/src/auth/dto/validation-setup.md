# Authentication Validation Setup

This document describes the validation rules and DTOs used in the authentication system.

## DTOs and Validation Rules

### LoginDto
- `email`: Must be a valid email address
- `password`: Must be at least 6 characters long

### RegisterUserDto
- `email`: Must be a valid email address
- `password`: Must be at least 6 characters long
- `phone`: Optional, must be a valid Japanese phone number format

### RegisterShopperDto
- `email`: Must be a valid email address
- `password`: Must be at least 6 characters long
- `phone`: Required, must be a valid Japanese phone number format

### RegisterAdminDto
- `email`: Must be a valid email address
- `password`: Must be at least 6 characters long
- `role`: Must be one of: 'support', 'manager', 'ops'

### RefreshTokenDto
- `refresh_token`: Must be a valid string

## Authentication Flow

1. **Registration**: Users register with email/password and receive JWT tokens
2. **Login**: Users authenticate with email/password and receive JWT tokens
3. **Token Refresh**: Users can refresh their access token using refresh token
4. **Protected Routes**: Routes are protected using JWT guards and role-based access control

## Security Features

- Passwords are hashed using bcrypt with 10 rounds
- JWT tokens have short expiration (15 minutes for access, 7 days for refresh)
- Role-based access control for different user types
- Input validation using class-validator decorators
- CORS protection for cross-origin requests

## Error Handling

- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials or tokens)
- 409: Conflict (email already exists)
- 403: Forbidden (insufficient permissions)