import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import {
  ISearchRepository,
  SearchFilters,
  SearchPagination,
  SearchResponse,
} from '../../../domain/ports/search-repository.port';
import { Product } from '../../../domain/models/product.model';

@Injectable()
export class ElasticsearchAdapter implements ISearchRepository {
  private readonly client: Client;
  private readonly indexName = 'products';

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200',
    });
  }

  async search(
    filters: SearchFilters,
    pagination: SearchPagination,
  ): Promise<SearchResponse> {
    const indexExists = await this.client.indices.exists({
      index: this.indexName,
    });
    if (!indexExists) {
      return {
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: 0,
        results: [],
        facets: {
          categories: {},
          subcategories: {},
          locations: {},
          priceStats: { min: 0, max: 0, avg: 0 },
        },
        suggestions: [],
      };
    }

    const must: any[] = [];
    const filter: any[] = [];

    if (filters.query) {
      must.push({
        multi_match: {
          query: filters.query,
          fields: ['name^3', 'category^2', 'subcategories', 'description'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (filters.category) {
      filter.push({ term: { category: filters.category } });
    }

    if (filters.subcategories && filters.subcategories.length > 0) {
      filter.push({ terms: { subcategories: filters.subcategories } });
    }

    if (filters.location) {
      filter.push({ term: { location: filters.location } });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const range: any = {};
      if (filters.minPrice !== undefined) range.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) range.lte = filters.maxPrice;
      filter.push({ range: { price: range } });
    }

    const sort: any[] = [];
    switch (pagination.sortBy) {
      case 'popularity':
        sort.push({ popularity: { order: 'desc' } });
        break;
      case 'created_at':
        sort.push({ created_at: { order: 'desc' } });
        break;
      case 'price_asc':
        sort.push({ price: { order: 'asc' } });
        break;
      case 'price_desc':
        sort.push({ price: { order: 'desc' } });
        break;
      case 'relevance':
      default:
        if (filters.query) sort.push({ _score: { order: 'desc' } });
        sort.push({ popularity: { order: 'desc' } });
        break;
    }

    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const from = Math.max(0, (page - 1) * limit);

    const suggestQuery: any = filters.query
      ? {
          'text-suggest': {
            text: filters.query,
            term: {
              field: 'name',
              suggest_mode: 'always',
            },
          },
        }
      : undefined;

    const response = await this.client.search({
      index: this.indexName,
      from,
      size: limit,
      query: { bool: { must, filter } },
      sort,
      suggest: suggestQuery,
      aggs: {
        categories: { terms: { field: 'category' } },
        subcategories: { terms: { field: 'subcategories' } },
        locations: { terms: { field: 'location' } },
        price_stats: { stats: { field: 'price' } },
      },
    });

    const hits = response.hits.hits;
    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;
    const totalPages = Math.ceil(total / limit);

    const results: Product[] = hits.map((hit: any) => ({
      id: hit._id,
      name: hit._source.name,
      description: hit._source.description,
      category: hit._source.category,
      subcategories: hit._source.subcategories,
      location: hit._source.location,
      price: hit._source.price,
      popularity: hit._source.popularity,
      createdAt: new Date(hit._source.created_at),
    }));

    let suggestions: string[] = [];
    if (response.suggest && (response.suggest as any)['text-suggest']) {
      const suggestEntries = (response.suggest as any)['text-suggest'];
      suggestEntries.forEach((entry: any) => {
        if (entry.options && entry.options.length > 0) {
          entry.options.forEach((opt: any) => suggestions.push(opt.text));
        }
      });
      suggestions = Array.from(new Set(suggestions));
    }

    const aggregations: any = response.aggregations || {};
    const facets = {
      categories: this.mapBucketToRecord(aggregations.categories),
      subcategories: this.mapBucketToRecord(aggregations.subcategories),
      locations: this.mapBucketToRecord(aggregations.locations),
      priceStats: {
        min: aggregations.price_stats?.min || 0,
        max: aggregations.price_stats?.max || 0,
        avg: aggregations.price_stats?.avg || 0,
      },
    };

    return {
      total,
      page,
      limit,
      totalPages,
      results,
      facets,
      suggestions,
    };
  }

  async autocompleteFromEngine(prefix: string): Promise<string[]> {
    const indexExists = await this.client.indices.exists({
      index: this.indexName,
    });
    if (!indexExists) {
      return [];
    }

    const response = await this.client.search({
      index: this.indexName,
      suggest: {
        'product-suggest': {
          prefix,
          completion: {
            field: 'name_suggest',
            size: 5,
            fuzzy: { fuzziness: 'AUTO' },
          },
        },
      },
    });

    const suggestOptions =
      (response.suggest as any)?.['product-suggest']?.[0]?.options || [];
    return suggestOptions.map((opt: any) => opt.text);
  }

  private mapBucketToRecord(agg: any): Record<string, number> {
    if (!agg || !agg.buckets) return {};
    return agg.buckets.reduce((acc: Record<string, number>, bucket: any) => {
      acc[bucket.key] = bucket.doc_count;
      return acc;
    }, {});
  }
}
