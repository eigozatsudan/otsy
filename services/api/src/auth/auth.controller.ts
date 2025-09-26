import { Controller, Post, Body, UseGuards, Request, Get, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterUserDto, RegisterShopperDto, RegisterAdminDto } from './dto/register.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

// Skip roles guard for auth endpoints
const SkipRolesGuard = () => SetMetadata('skipRolesGuard', true);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SkipRolesGuard()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @SkipRolesGuard()
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refresh_token);
  }

  @SkipRolesGuard()
  @Post('register/user')
  async registerUser(@Body() registerDto: RegisterUserDto) {
    const user = await this.authService.registerUser(registerDto);
    return this.authService.login(user);
  }

  @SkipRolesGuard()
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}