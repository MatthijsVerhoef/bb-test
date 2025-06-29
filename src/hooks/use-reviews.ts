// hooks/use-reviews.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient,
    UseQueryResult
  } from '@tanstack/react-query';
  import { ApiClient } from '@/lib/api-client';
  
  export interface ReviewData {
    id: string;
    rating: number;
    title?: string | null;
    comment: string | null;
    response?: string | null;
    responseDate?: Date | null;
    createdAt: Date;
    trailerTitle?: string | null;
    trailerImage?: string | null;
    reviewerName?: string | null;
    reviewerId?: string | null;
    reviewerImage?: string | null;
    cleanliness?: number | null;
    maintenance?: number | null;
    valueForMoney?: number | null;
    communication?: number | null;
    accuracy?: number | null;
    recommended?: boolean | null;
  }
  
  interface ReviewsResponse {
    reviews: ReviewData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }
  
  interface ReviewCounts {
    total: number;
    positive: number;
    improvement: number;
    averageRating: number | null;
    ratingBreakdown?: Record<number, number>;
  }
  
  // Query keys factory
  export const reviewKeys = {
    all: ['reviews'] as const,
    lists: () => [...reviewKeys.all, 'list'] as const,
    list: (role: string) => [...reviewKeys.lists(), role] as const,
    counts: (role: string) => [...reviewKeys.all, 'counts', role] as const,
    detail: (id: string) => [...reviewKeys.all, 'detail', id] as const,
  };
  
  // Hook for fetching reviews
  export function useReviews(role: 'USER' | 'LESSOR' | 'ADMIN' | 'SUPPORT') {
    const queryClient = useQueryClient();
  
    // Fetch reviews
    const reviewsQuery = useQuery({
      queryKey: reviewKeys.list(role),
      queryFn: () => ApiClient.get<ReviewsResponse>(`/api/user/profile/reviews?role=${role}`),
      select: (data) => data.reviews,
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });
  
    // Fetch counts
    const countsQuery = useQuery({
      queryKey: reviewKeys.counts(role),
      queryFn: () => ApiClient.get<ReviewCounts>(`/api/user/profile/reviews/counts?role=${role}`),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    });
  
    // Respond to review mutation (for lessors)
    const respondMutation = useMutation({
      mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
        ApiClient.post(`/api/user/profile/reviews/${reviewId}/respond`, { response }),
      onMutate: async ({ reviewId, response }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: reviewKeys.list(role) });
  
        // Snapshot the previous value
        const previousReviews = queryClient.getQueryData<ReviewData[]>(reviewKeys.list(role));
  
        // Optimistically update
        if (previousReviews) {
          queryClient.setQueryData<ReviewData[]>(
            reviewKeys.list(role),
            previousReviews.map(review =>
              review.id === reviewId
                ? { ...review, response, responseDate: new Date() }
                : review
            )
          );
        }
  
        return { previousReviews };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousReviews) {
          queryClient.setQueryData(reviewKeys.list(role), context.previousReviews);
        }
      },
      onSettled: () => {
        // Refetch after mutation
        queryClient.invalidateQueries({ queryKey: reviewKeys.list(role) });
      },
    });
  
    // Edit review mutation (for users)
    const editMutation = useMutation({
      mutationFn: ({ 
        reviewId, 
        title, 
        comment, 
        rating 
      }: { 
        reviewId: string; 
        title: string; 
        comment: string; 
        rating: number;
      }) =>
        ApiClient.patch(`/api/user/profile/reviews/${reviewId}`, { title, comment, rating }),
      onMutate: async ({ reviewId, title, comment, rating }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: reviewKeys.list(role) });
  
        // Snapshot the previous value
        const previousReviews = queryClient.getQueryData<ReviewData[]>(reviewKeys.list(role));
  
        // Optimistically update
        if (previousReviews) {
          queryClient.setQueryData<ReviewData[]>(
            reviewKeys.list(role),
            previousReviews.map(review =>
              review.id === reviewId
                ? { ...review, title, comment, rating }
                : review
            )
          );
        }
  
        return { previousReviews };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousReviews) {
          queryClient.setQueryData(reviewKeys.list(role), context.previousReviews);
        }
      },
      onSettled: () => {
        // Refetch both reviews and counts after mutation
        queryClient.invalidateQueries({ queryKey: reviewKeys.list(role) });
        queryClient.invalidateQueries({ queryKey: reviewKeys.counts(role) });
      },
    });
  
    return {
      // Data
      reviews: reviewsQuery.data || [],
      counts: countsQuery.data || { total: 0, positive: 0, improvement: 0, averageRating: null },
      
      // Loading states
      isLoading: reviewsQuery.isLoading,
      isLoadingCounts: countsQuery.isLoading,
      
      // Error states
      error: reviewsQuery.error,
      countsError: countsQuery.error,
      
      // Mutations
      respondToReview: respondMutation.mutate,
      editReview: editMutation.mutate,
      
      // Mutation states
      isResponding: respondMutation.isPending,
      isEditing: editMutation.isPending,
      
      // Refetch functions
      refetchReviews: reviewsQuery.refetch,
      refetchCounts: countsQuery.refetch,
    };
  }
  
  // Hook for prefetching reviews (useful for tab navigation)
  export function usePrefetchReviews() {
    const queryClient = useQueryClient();
  
    const prefetchReviews = (role: string) => {
      return queryClient.prefetchQuery({
        queryKey: reviewKeys.list(role),
        queryFn: () => ApiClient.get<ReviewsResponse>(`/api/user/profile/reviews?role=${role}`),
        staleTime: 60 * 1000,
      });
    };
  
    const prefetchCounts = (role: string) => {
      return queryClient.prefetchQuery({
        queryKey: reviewKeys.counts(role),
        queryFn: () => ApiClient.get<ReviewCounts>(`/api/user/profile/reviews/counts?role=${role}`),
        staleTime: 5 * 60 * 1000,
      });
    };
  
    return {
      prefetchReviews,
      prefetchCounts,
    };
  }