"use client";

import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from "@/stores/auth.store";
import { useCallback, useEffect } from 'react';

export interface TrailerSummary {
  id: string;
  title: string;
  city?: string;
  pricePerDay: number;
  mainImage: string;
}

export const fetchFavorites = async (): Promise<TrailerSummary[]> => {
  const { user } = getCurrentUser();
  
  try {
    const memoryCache = (window as any)['favoriteMemoryCache'];
    const CACHE_TTL = 5 * 60 * 1000;
    
    if (memoryCache && memoryCache.timestamp > Date.now() - CACHE_TTL) {
      return memoryCache.data;
    }
    
    const sessionCache = sessionStorage.getItem('favoriteSessionCache');
    if (sessionCache) {
      const parsedCache = JSON.parse(sessionCache);
      if (parsedCache.timestamp > Date.now() - CACHE_TTL) {
        (window as any)['favoriteMemoryCache'] = {
          data: parsedCache.data,
          timestamp: parsedCache.timestamp
        };
        return parsedCache.data;
      }
    }
    
    const localFavorites = localStorage.getItem('trailerFavorites');
    if (localFavorites) {
      const parsedFavorites = JSON.parse(localFavorites);
      
      (window as any)['favoriteMemoryCache'] = {
        data: parsedFavorites,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('favoriteSessionCache', JSON.stringify({
        data: parsedFavorites,
        timestamp: Date.now()
      }));
      
      return parsedFavorites;
    }
  } catch (error) {
    console.warn("Error reading from cache:", error);
  }
  
  if (!user) {
    return [];
  }
  
  try {
    const data = await ApiClient.get<{favorites: TrailerSummary[]}>('/api/favorites', {
      cacheConfig: {
        ttl: 300000,
        cacheKey: 'favorites'
      }
    });
    
    try {
      (window as any)['favoriteMemoryCache'] = {
        data: data.favorites,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('favoriteSessionCache', JSON.stringify({
        data: data.favorites,
        timestamp: Date.now()
      }));
      
      if (!user) {
        localStorage.setItem('trailerFavorites', JSON.stringify(data.favorites));
      }
    } catch (cacheError) {
      console.warn("Error updating caches:", cacheError);
    }
    
    return data.favorites;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

const getCurrentUser = () => {
  try {
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      const parsedSession = JSON.parse(userSession);
      if (parsedSession.expiry > Date.now()) {
        return { user: parsedSession.user };
      }
    }
  } catch (e) {}
  
  return { user: null };
};

export const addFavoriteApi = async (trailer: TrailerSummary): Promise<void> => {
  return ApiClient.post('/api/favorites', { trailerId: trailer.id }, {
    cacheConfig: {
      ttl: 0,
      bypassCache: true
    }
  });
};

export const removeFavoriteApi = async (trailerId: string): Promise<void> => {
  return ApiClient.delete(`/api/favorites/${trailerId}`, {
    cacheConfig: {
      ttl: 0,
      bypassCache: true
    }
  });
};

export const syncFavoritesApi = async (favorites: TrailerSummary[]): Promise<TrailerSummary[]> => {
  const response = await ApiClient.post<{favorites: TrailerSummary[]}>('/api/favorites/sync', { favorites }, {
    cacheConfig: {
      ttl: 0,
      bypassCache: true
    }
  });
  
  return response.favorites;
};

export function useFavoritesData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const {
    data = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: [],
    enabled: !!user,
  });
  
  const updateAllCaches = useCallback((data: TrailerSummary[]) => {
    try {
      (window as any)['favoriteMemoryCache'] = {
        data,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('favoriteSessionCache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      if (!user) {
        localStorage.setItem('trailerFavorites', JSON.stringify(data));
      }
    } catch (error) {
      console.warn("Error updating caches:", error);
    }
  }, [user]);
  
  const addFavoriteMutation = useMutation({
    mutationFn: addFavoriteApi,
    onMutate: async (trailer) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      
      const previousFavorites = queryClient.getQueryData<TrailerSummary[]>(['favorites']) || [];
      
      if (previousFavorites.some(fav => fav.id === trailer.id)) {
        return { previousFavorites };
      }
      
      const updatedFavorites = [...previousFavorites, trailer];
      queryClient.setQueryData(['favorites'], updatedFavorites);
      
      updateAllCaches(updatedFavorites);
      
      return { previousFavorites };
    },
    onError: (_, __, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
        updateAllCaches(context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });
  
  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavoriteApi,
    onMutate: async (trailerId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      
      const previousFavorites = queryClient.getQueryData<TrailerSummary[]>(['favorites']) || [];
      
      const updatedFavorites = previousFavorites.filter(fav => fav.id !== trailerId);
      queryClient.setQueryData(['favorites'], updatedFavorites);
      
      updateAllCaches(updatedFavorites);
      
      return { previousFavorites };
    },
    onError: (_, __, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
        updateAllCaches(context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });
  
  useEffect(() => {
    const syncLocalFavorites = async () => {
      if (user) {
        try {
          const localFavorites = localStorage.getItem('trailerFavorites');
          if (localFavorites) {
            const favorites = JSON.parse(localFavorites);
            if (favorites.length > 0) {
              const syncedFavorites = await syncFavoritesApi(favorites);
              queryClient.setQueryData(['favorites'], syncedFavorites);
              updateAllCaches(syncedFavorites);
              localStorage.removeItem('trailerFavorites');
            }
          }
        } catch (error) {
          console.error("Error syncing favorites:", error);
        }
      }
    };
    
    if (user) {
      syncLocalFavorites();
    }
  }, [user, queryClient, updateAllCaches]);
  
  const addFavorite = async (trailer: TrailerSummary) => {
    await addFavoriteMutation.mutateAsync(trailer);
  };
  
  const removeFavorite = async (trailerId: string) => {
    await removeFavoriteMutation.mutateAsync(trailerId);
  };
  
  const isFavorite = useCallback((trailerId: string) => {
    return data.some((fav) => fav.id === trailerId);
  }, [data]);
  
  const refreshFavorites = async () => {
    await refetch();
  };
  
  return {
    favorites: data,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites,
    
    addFavoriteStatus: addFavoriteMutation.status,
    removeFavoriteStatus: removeFavoriteMutation.status
  };
}