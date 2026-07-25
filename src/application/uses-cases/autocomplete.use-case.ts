import { Inject, Injectable } from '@nestjs/common';
import {
  ISearchRepository,
  SEARCH_REPOSITORY_PORT,
} from '@domain/ports/search-repository.port';
import {
  ICacheRepository,
  CACHE_REPOSITORY_PORT,
} from '@domain/ports/cache-repository.port';

@Injectable()
export class AutocompleteUseCase {
  private readonly TTL_SECONDS = 300;

  constructor(
    @Inject(SEARCH_REPOSITORY_PORT)
    private readonly searchRepository: ISearchRepository,
    @Inject(CACHE_REPOSITORY_PORT)
    private readonly cacheRepository: ICacheRepository,
  ) {}

  async execute(prefix: string): Promise<string[]> {
    const cacheKey = `autocomplete:${prefix.toLowerCase().trim()}`;

    // 1. Try to retrieve from Redis
    const cachedSuggestions = await this.cacheRepository.get<string[]>(cacheKey);
    if (cachedSuggestions) {
      return cachedSuggestions;
    }

    // 2. If not cached, query Elasticsearch
    const suggestions = await this.searchRepository.autocompleteFromEngine(prefix);

    // 3. Save into Redis with TTL
    if (suggestions.length > 0) {
      await this.cacheRepository.set(cacheKey, suggestions, this.TTL_SECONDS);
    }

    return suggestions;
  }
}