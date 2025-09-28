import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemCategoryDto, UpdateItemCategoryDto } from './dto/item-category.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // Category endpoints
  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createCategory(@Body() createCategoryDto: CreateItemCategoryDto) {
    return this.itemsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  findAllCategories() {
    return this.itemsService.findAllCategories();
  }

  @Get('categories/:id')
  findCategoryById(@Param('id') id: string) {
    return this.itemsService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateItemCategoryDto,
  ) {
    return this.itemsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  deleteCategory(@Param('id') id: string) {
    return this.itemsService.deleteCategory(id);
  }

  // Item endpoints
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  createItem(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.createItem(createItemDto);
  }

  @Get()
  findAllItems() {
    return this.itemsService.findAllItems();
  }

  @Get('search')
  searchItems(@Query('q') query: string) {
    return this.itemsService.searchItems(query);
  }

  @Get('category/:categoryId')
  findItemsByCategory(@Param('categoryId') categoryId: string) {
    return this.itemsService.findItemsByCategory(categoryId);
  }

  @Get(':id')
  findItemById(@Param('id') id: string) {
    return this.itemsService.findItemById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateItem(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.updateItem(id, updateItemDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  deleteItem(@Param('id') id: string) {
    return this.itemsService.deleteItem(id);
  }
}
