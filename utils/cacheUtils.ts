
const CACHE_PREFIX = 'sentinel-cache-';
const DEFAULT_TTL = 3600 * 1000; // 1 hour in milliseconds

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Sets a value in the localStorage cache with a TTL.
 * @param key The cache key.
 * @param data The data to store.
 * @param ttl The time-to-live in milliseconds.
 */
export const setCache = <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiry = Date.now() + ttl;
    const cacheEntry: CacheEntry<T> = { data, expiry };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error("Failed to write to cache:", error);
    // This can happen if localStorage is full or disabled.
  }
};

/**
 * Gets a value from the localStorage cache, returning null if it's expired or doesn't exist.
 * @param key The cache key.
 * @returns The cached data or null.
 */
export const getCache = <T>(key: string): T | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const itemStr = localStorage.getItem(cacheKey);
    if (!itemStr) {
      return null;
    }
    const cacheEntry: CacheEntry<T> = JSON.parse(itemStr);
    if (Date.now() > cacheEntry.expiry) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return cacheEntry.data;
  } catch (error) {
    console.error("Failed to read from cache:", error);
    return null;
  }
};
