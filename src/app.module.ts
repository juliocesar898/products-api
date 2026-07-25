import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SEARCH_REPOSITORY_PORT } from './domain/ports/search-repository.port';
import { CACHE_REPOSITORY_PORT } from './domain/ports/cache-repository.port';
import { ElasticsearchAdapter } from './infrastructure/adapters/elasticsearch/elasticsearch.adapter';
import { RedisAdapter } from './infrastructure/adapters/redis/redis.adapter';
import { SearchController } from './infrastructure/controllers/search.controller';
import { SearchProductsUseCase } from '@application/uses-cases/search-products.use-case';
import { AutocompleteUseCase } from '@application/uses-cases/autocomplete.use-case';
import { HealthController } from '@infrastructure/controllers/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [SearchController, HealthController],
  providers: [
    SearchProductsUseCase,
    AutocompleteUseCase,
    {
      provide: SEARCH_REPOSITORY_PORT,
      useClass: ElasticsearchAdapter,
    },
    {
      provide: CACHE_REPOSITORY_PORT,
      useClass: RedisAdapter,
    },
  ],
})
export class AppModule {}