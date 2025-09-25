import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ShoppersService, UpdateShopperDto, UpdateShopperStatusDto } from './shoppers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('shoppers')
@UseGuards(JwtAuthGuard)
export class ShoppersController {
  constructor(private readonly shoppersService: ShoppersService) {}

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.shoppersService.findOne(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Get('me/stats')
  async getStats(@CurrentUser() user: any) {
    return this.shoppersService.getShopperStats(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Patch('me')
  async updateProfile(@CurrentUser() user: any, @Body() updateShopperDto: UpdateShopperDto) {
    return this.shoppersService.updateProfile(user.id, updateShopperDto);
  }

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Get('me/can-accept-orders')
  async canAcceptOrders(@CurrentUser() user: any) {
    const canAccept = await this.shoppersService.canAcceptOrders(user.id);
    return { can_accept_orders: canAccept };
  }

  // Admin endpoints
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return this.shoppersService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shoppersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id/stats')
  async getShopperStats(@Param('id') id: string) {
    return this.shoppersService.getShopperStats(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateShopperStatusDto
  ) {
    return this.shoppersService.updateStatus(admin.id, id, updateStatusDto);
  }
}