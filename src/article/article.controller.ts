import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ArticlesQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Article created' })
  async create(@CurrentUser() user: User, @Body() dto: CreateArticleDto) {
    const article = await this.articleService.create(user.id, dto);
    return { article };
  }

  @Get()
  @ApiOperation({ summary: 'Get articles with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of articles' })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Comma-separated tags (OR filter)',
  })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  async findAll(
    @Query() query: ArticlesQueryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.articleService.findAll(query, userId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Article details' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    const article = await this.articleService.findOne(id, userId);
    return { article };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Article updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateArticleDto,
  ) {
    const article = await this.articleService.update(
      id,
      user.id,
      user.role as 'USER' | 'ADMIN',
      dto,
    );
    return { article };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Article deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.articleService.remove(
      id,
      user.id,
      user.role as 'USER' | 'ADMIN',
    );
    return { message: 'Article deleted successfully' };
  }
}
