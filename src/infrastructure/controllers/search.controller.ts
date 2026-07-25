import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchProductsDto } from '../../application/dtos/search-products.dto';
import { AutocompleteDto } from '../../application/dtos/autocomplete.dto';
import { AutocompleteUseCase } from '@application/uses-cases/autocomplete.use-case';
import { SearchProductsUseCase } from '@application/uses-cases/search-products.use-case';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly autocompleteUseCase: AutocompleteUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Advanced product search with filters and facets' })
  @ApiResponse({ status: 200, description: 'Search results found successfully.' })
  async search(@Query() dto: SearchProductsDto) {
    return this.searchProductsUseCase.execute(dto);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Real-time autocomplete suggestions' })
  @ApiQuery({ name: 'q', description: 'Prefix to search (Example: lap, smart)', required: true, example: 'lap' })
  @ApiResponse({ status: 200, description: 'Suggestions successfully returned.' })
  @ApiResponse({ status: 400, description: 'Missing or invalid query parameter "q".' })
  async autocomplete(@Query() dto: AutocompleteDto) {
    const suggestions = await this.autocompleteUseCase.execute(dto.q);
    return { suggestions };
  }
}