// hooks/use-profile-data.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';

// Query keys factory
export const profileKeys = {
  all: ['profile'] as const,
  lessorDashboard: (userId: string) => [...profileKeys.all, 'lessor-dashboard', userId] as const,
  lessorHistory: (userId: string) => [...profileKeys.all, 'lessor-history', userId] as const,
  rentalHistory: (userId: string) => [...profileKeys.all, 'rental-history', userId] as const,
  favorites: (userId: string) => [...profileKeys.all, 'favorites', userId] as const,
  reviews: (userId: string, role: string) => [...profileKeys.all, 'reviews', userId, role] as const,
  trailers: (userId: string) => [...profileKeys.all, 'trailers', userId] as const,
};

// Lessor Dashboard Hook
export function useLessorDashboard(userId: string, enabled = true) {
  return useQuery({
    queryKey: profileKeys.lessorDashboard(userId),
    queryFn: () => ApiClient.get('/api/user/profile/lessor-dashboard'),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
  });
}

// Lessor History Hook
export function useLessorHistory(userId: string, enabled = true) {
  return useQuery({
    queryKey: profileKeys.lessorHistory(userId),
    queryFn: () => ApiClient.get('/api/user/profile/lessor-history'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Rental History Hook
export function useRentalHistory(userId: string, enabled = true) {
  return useQuery({
    queryKey: profileKeys.rentalHistory(userId),
    queryFn: () => ApiClient.get('/api/user/profile/rental-history'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Prefetch utilities
export function usePrefetchProfileData() {
  const queryClient = useQueryClient();

  const prefetchLessorDashboard = (userId: string) => {
    return queryClient.prefetchQuery({
      queryKey: profileKeys.lessorDashboard(userId),
      queryFn: () => ApiClient.get('/api/user/profile/lessor-dashboard'),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchLessorHistory = (userId: string) => {
    return queryClient.prefetchQuery({
      queryKey: profileKeys.lessorHistory(userId),
      queryFn: () => ApiClient.get('/api/user/profile/lessor-history'),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchLessorDashboard,
    prefetchLessorHistory,
  };
}