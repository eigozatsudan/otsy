import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: 'Display name', example: 'John Doe' })
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  display_name: string;

  @ApiProperty({ description: 'Password', example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: 'Password', example: 'SecurePassword123!' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

export class UpdateProfileDto {
  @ApiProperty({ description: 'Display name', example: 'John Doe', required: false })
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  display_name?: string;

  @ApiProperty({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg', required: false })
  @IsString()
  avatar_url?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  current_password: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  new_password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  new_password: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'User information' })
  user: UserProfileDto;
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Display name' })
  display_name: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  avatar_url?: string;

  @ApiProperty({ description: 'Account creation date' })
  created_at: Date;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  refresh_token: string;
}