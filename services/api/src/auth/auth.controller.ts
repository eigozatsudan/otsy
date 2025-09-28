import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterUserDto, RegisterShopperDto, RegisterAdminDto } from './dto/register.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refresh_token);
  }

  @Post('register/user')
  async registerUser(@Body() registerDto: RegisterUserDto) {
    const user = await this.authService.registerUser(registerDto);
    return this.authService.login(user);
  }

  @Post('register/shopper')
  async registerShopper(@Body() registerDto: RegisterShopperDto) {
    const shopper = await this.authService.registerShopper(registerDto);
    return this.authService.login(shopper);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('register/admin')
  async registerAdmin(@Body() registerDto: RegisterAdminDto) {
    const admin = await this.authService.registerAdmin(registerDto);
    return { user: admin };
  }

  @Post('shopper/login')
  async loginShopper(@Body() loginDto: LoginDto) {
    const shopper = await this.authService.validateShopper(loginDto.email, loginDto.password);
    if (!shopper) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.loginShopper(shopper);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    // Check user role and return appropriate profile
    if (user.role === 'shopper') {
      const shopper = await this.authService.getShopperProfile(user.id);
      return { shopper };
    } else {
      // For regular users, get full user profile
      const userProfile = await this.authService.getUserProfile(user.id);
      return { user: userProfile };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    return { user };
  }
}