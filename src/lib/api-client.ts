import { useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

interface CacheConfig {
  ttl: number; 
  persistToStorage?: boolean;
  storageKeyPrefix?: string;
  cacheKey?: string;
  bypassCache?: boolean;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOn?: number[];
}

interface RequestConfig extends Omit<RequestInit, 'signal'> {
  timeout?: number;
  cacheConfig?: Partial<CacheConfig>;
  retryConfig?: Partial<RetryConfig>;
  onProgress?: (progress: number) => void;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 60000,
  persistToStorage: false,
  storageKeyPrefix: 'api_cache',
  bypassCache: false,
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504],
};

function createApiError(message: string, status?: number, details?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.details = details;
  return error;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateCacheKey(url: string, options?: RequestConfig): string {
  if (options?.cacheConfig?.cacheKey) {
    return options.cacheConfig.cacheKey;
  }
  
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

export class ApiClient {
  private static requestsInProgress = new Map<string, Promise<any>>();
  private static memoryCache = new Map<string, CacheEntry<any>>();
  private static abortControllers = new Map<string, AbortController>();

  static clearCache(keys?: string[]): void {
    if (!keys) {
      this.memoryCache.clear();
      if (typeof window !== 'undefined') {
        const storageKeys = Object.keys(localStorage).filter(key => 
          key.startsWith(DEFAULT_CACHE_CONFIG.storageKeyPrefix!)
        );
        storageKeys.forEach(key => localStorage.removeItem(key));
      }
      return;
    }

    keys.forEach(key => {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${DEFAULT_CACHE_CONFIG.storageKeyPrefix}_${key}`);
      }
    });
  }

  private static saveToCache<T>(key: string, data: T, config: CacheConfig): void {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    this.memoryCache.set(key, cacheEntry);

    if (config.persistToStorage && typeof window !== 'undefined') {
      try {
        const storageKey = `${config.storageKeyPrefix}_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }

  private static getFromCache<T>(key: string, config: CacheConfig): T | undefined {
    const now = Date.now();

    const memoryCacheEntry = this.memoryCache.get(key);
    if (memoryCacheEntry && now - memoryCacheEntry.timestamp < config.ttl) {
      return memoryCacheEntry.data as T;
    }

    if (config.persistToStorage && typeof window !== 'undefined') {
      try {
        const storageKey = `${config.storageKeyPrefix}_${key}`;
        const storedItem = localStorage.getItem(storageKey);
        
        if (storedItem) {
          const parsedItem = JSON.parse(storedItem) as CacheEntry<T>;
          
          if (now - parsedItem.timestamp < config.ttl) {
            this.memoryCache.set(key, parsedItem);
            return parsedItem.data;
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve cache from localStorage:', error);
      }
    }

    return undefined;
  }

  static abortRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  static abortAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  static async fetch<T = any>(url: string, options?: RequestConfig): Promise<T> {
    const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...options?.cacheConfig };
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };
    const timeout = options?.timeout || DEFAULT_TIMEOUT;
    
    const cacheKey = generateCacheKey(url, options);

    if (!cacheConfig.bypassCache && (!options?.method || options.method === 'GET')) {
      const cachedData = this.getFromCache<T>(cacheKey, cacheConfig);
      if (cachedData !== undefined) {
        return cachedData;
      }
    }

    const existingRequest = this.requestsInProgress.get(cacheKey);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cacheKey, abortController);

    const timeoutId = setTimeout(() => {
      abortController.abort();
      this.abortControllers.delete(cacheKey);
    }, timeout);

    let signal = abortController.signal;
    if (options?.signal) {
      const originalSignal = options.signal as AbortSignal;
      const abortHandler = () => abortController.abort();
      originalSignal.addEventListener('abort', abortHandler);
      signal = abortController.signal;
    }

    const fetchWithRetry = async (attempt: number = 0): Promise<T> => {
      try {
        const response = await fetch(url, {
          ...options,
          signal,
          credentials: options?.credentials || 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const shouldRetry = retryConfig.retryOn?.includes(response.status) && 
                            attempt < retryConfig.maxRetries;

          if (shouldRetry) {
            await delay(retryConfig.retryDelay * Math.pow(2, attempt));
            return fetchWithRetry(attempt + 1);
          }

          let errorData: any = null;
          try {
            errorData = await response.json();
          } catch {}

          throw createApiError(
            errorData?.error || errorData?.message || `Request failed with status ${response.status}`,
            response.status,
            errorData
          );
        }

        const data = await response.json() as T;

        if (!options?.method || options.method === 'GET') {
          this.saveToCache(cacheKey, data, cacheConfig);
        }

        return data;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw createApiError(
            'Request was aborted',
            0,
            { timeout: error.message?.includes('timeout') }
          );
        }

        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          if (attempt < retryConfig.maxRetries) {
            await delay(retryConfig.retryDelay * Math.pow(2, attempt));
            return fetchWithRetry(attempt + 1);
          }
          throw createApiError('Network error. Please check your internet connection.', 0);
        }

        throw error;
      }
    };

    const requestPromise = fetchWithRetry()
      .finally(() => {
        clearTimeout(timeoutId);
        this.requestsInProgress.delete(cacheKey);
        this.abortControllers.delete(cacheKey);
      });

    this.requestsInProgress.set(cacheKey, requestPromise);
    return requestPromise;
  }

  static get<T = any>(url: string, options?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  static post<T = any>(url: string, data?: any, options?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.fetch<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T = any>(url: string, data?: any, options?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.fetch<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T = any>(url: string, options?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.fetch<T>(url, { ...options, method: 'DELETE' });
  }

  static patch<T = any>(url: string, data?: any, options?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.fetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export function useApiClient() {
  const memoryCache = useRef(new Map<string, CacheEntry<any>>());
  const abortControllers = useRef(new Map<string, AbortController>());

  const clearCache = useCallback((keys?: string[]) => {
    if (!keys) {
      memoryCache.current.clear();
      return;
    }
    keys.forEach(key => memoryCache.current.delete(key));
  }, []);

  const abortRequest = useCallback((key: string) => {
    const controller = abortControllers.current.get(key);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(key);
    }
  }, []);

  const fetch = useCallback(async <T = any>(
    url: string,
    options?: RequestConfig
  ): Promise<T> => {
    return ApiClient.fetch<T>(url, options);
  }, []);

  return {
    fetch,
    get: <T = any>(url: string, options?: Omit<RequestConfig, 'method' | 'body'>) => 
      fetch<T>(url, { ...options, method: 'GET' }),
    post: <T = any>(url: string, data?: any, options?: Omit<RequestConfig, 'method'>) => 
      fetch<T>(url, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
    put: <T = any>(url: string, data?: any, options?: Omit<RequestConfig, 'method'>) => 
      fetch<T>(url, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
    delete: <T = any>(url: string, options?: Omit<RequestConfig, 'method'>) => 
      fetch<T>(url, { ...options, method: 'DELETE' }),
    patch: <T = any>(url: string, data?: any, options?: Omit<RequestConfig, 'method'>) => 
      fetch<T>(url, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
    clearCache,
    abortRequest,
  };
}

export const enhancedFetch = ApiClient.fetch.bind(ApiClient);