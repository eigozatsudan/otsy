import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;
}

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}