import { Product } from '../models/product.model';

export const SEARCH_REPOSITORY_PORT = 'SEARCH_REPOSITORY_PORT';

export interface SearchFilters {
  query?: string;
  category?: string;
  subcategories?: string[];
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchPagination {
  page: number;
  limit: number;
  sortBy?:
    'relevance' | 'popularity' | 'created_at' | 'price_asc' | 'price_desc';
}

export interface SearchFacets {
  categories: Record<string, number>;
  subcategories: Record<string, number>;
  locations: Record<string, number>;
  priceStats: {
    min: number;
    max: number;
    avg: number;
  };
}

export interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: Product[];
  facets: SearchFacets;
  suggestions: string[];
}

export interface ISearchRepository {
  search(
    filters: SearchFilters,
    pagination: SearchPagination,
  ): Promise<SearchResponse>;
  autocompleteFromEngine(prefix: string): Promise<string[]>;
}
