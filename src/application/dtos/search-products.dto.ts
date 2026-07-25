import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, Min, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchProductsDto {
  @ApiPropertyOptional({ description: 'Free-text search term (Supports Fuzzy Search)', example: 'laptob' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Exact category', example: 'electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'List of subcategories', example: ['laptops', 'gaming'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  subcategories?: string[];

  @ApiPropertyOptional({ description: 'Location / City', example: 'Caracas' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Minimum price', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 1))
  page: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 10))
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Sorting criterion',
    enum: ['relevance', 'popularity', 'created_at', 'price_asc', 'price_desc'],
    default: 'relevance',
  })
  @IsOptional()
  @IsIn(['relevance', 'popularity', 'created_at', 'price_asc', 'price_desc'])
  sortBy?: 'relevance' | 'popularity' | 'created_at' | 'price_asc' | 'price_desc' = 'relevance';
}