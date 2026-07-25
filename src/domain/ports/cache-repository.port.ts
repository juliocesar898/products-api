export const CACHE_REPOSITORY_PORT = 'CACHE_REPOSITORY_PORT';

export interface ICacheRepository {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlInSeconds?: number): Promise<void>;
}