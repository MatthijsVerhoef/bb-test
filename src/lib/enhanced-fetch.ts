type FetchOptions = RequestInit & {
    cacheConfig?: {
      ttl?: number;
      cacheKey?: string;
    };
  };
  
  let requestsInProgress: Record<string, Promise<any>> = {};
  
  export async function enhancedFetch<T = any>(
    url: string,
    options?: FetchOptions
  ): Promise<T> {
    const requestKey = `${url}:${JSON.stringify(options?.body || {})}`;
  
    if (requestsInProgress[requestKey]) {
      return requestsInProgress[requestKey] as Promise<T>;
    }
  
    const controller = new AbortController();
    const TIMEOUT_MS = 15000;
    
    let signal = controller.signal;
    if (options?.signal) {
      const originalSignal = options.signal;
      const abortHandler = () => controller.abort();
      originalSignal.addEventListener('abort', abortHandler);
    }
    
    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Request timeout', 'TimeoutError'));
    }, TIMEOUT_MS);
  
    try {
      const fetchPromise = fetch(url, {
        ...options,
        signal,
        credentials: 'include', // Add credentials to include cookies in the request
        headers: {
          ...options?.headers,
          "Cache-Control": options?.cacheConfig?.ttl ? 
            `max-age=${options.cacheConfig.ttl}` : 
            "no-cache",
        },
      }).then(async (response) => {
        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
          }
          throw new Error(errorMessage);
        }
        
        return response.json() as Promise<T>;
      });
  
      requestsInProgress[requestKey] = fetchPromise;
  
      return await fetchPromise;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please check your network connection and try again.');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
      delete requestsInProgress[requestKey];
    }
  }