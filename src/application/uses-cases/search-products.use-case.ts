import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ISearchRepository,
  SEARCH_REPOSITORY_PORT,
  SearchResponse,
} from '../../domain/ports/search-repository.port';
import { SearchProductsDto } from '../dtos/search-products.dto';

@Injectable()
export class SearchProductsUseCase {
  constructor(
    @Inject(SEARCH_REPOSITORY_PORT)
    private readonly searchRepository: ISearchRepository,
  ) {}

  async execute(dto: SearchProductsDto): Promise<SearchResponse> {
    if (
      dto.minPrice !== undefined &&
      dto.maxPrice !== undefined &&
      dto.minPrice > dto.maxPrice
    ) {
      throw new BadRequestException('minPrice no puede ser mayor que maxPrice');
    }

    return this.searchRepository.search(
      {
        query: dto.q,
        category: dto.category,
        subcategories: dto.subcategories,
        location: dto.location,
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
      },
      {
        page: dto.page,
        limit: dto.limit,
        sortBy: dto.sortBy,
      },
    );
  }
}
