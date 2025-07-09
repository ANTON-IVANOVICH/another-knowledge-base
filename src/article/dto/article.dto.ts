import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: [String], example: ['tag1', 'tag2'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  tags: string[];

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateArticleDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class ArticleResponse {
  @ApiProperty({
    example: 'cjujrmql4000103lqzrmx6v1f',
    description: 'Article ID',
  })
  id: string;

  @ApiProperty({ example: 'My First Article', description: 'Article title' })
  title: string;

  @ApiProperty({
    example: 'Content of the article',
    description: 'Article content',
  })
  content: string;

  @ApiProperty({ example: ['tag1', 'tag2'], description: 'Article tags' })
  tags: string[];

  @ApiProperty({ example: true, description: 'Is article public?' })
  isPublic: boolean;

  @ApiProperty({
    example: 'cjujrmql4000103lqzrmx6v1f',
    description: 'Author ID',
  })
  authorId: string;

  @ApiProperty({
    example: '2023-05-15T10:00:00.000Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-05-15T10:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;
}

export class ArticlesQueryDto {
  @ApiPropertyOptional({ default: 10 })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => {
    const numValue = typeof value === 'string' ? value : String(value);
    const parsed = parseInt(numValue, 10);
    return isNaN(parsed) ? 10 : parsed;
  })
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => {
    const numValue = typeof value === 'string' ? value : String(value);
    const parsed = parseInt(numValue, 10);
    return isNaN(parsed) ? 0 : parsed;
  })
  offset?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by tags (comma separated)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string')
      return value.split(',').filter((tag) => tag.trim() !== '');
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by public status',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  author?: string;
}
