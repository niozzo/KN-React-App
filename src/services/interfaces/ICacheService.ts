/**
 * Interface for Cache Service
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: string;
  version: string;
}

export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, version?: string): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
