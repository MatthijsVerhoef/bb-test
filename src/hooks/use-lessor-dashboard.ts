// hooks/use-lessor-dashboard.ts
import { useQuery, useQueries } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';

// Types
interface DashboardStats {
  totalRentals: number;
  totalIncome: number;
  completedRentals: number;
  cancelledRentals: number;
  averageRating: number | null;
  responseRate: number | null;
  responseTime: number | null;
  acceptanceRate: number | null;
}

interface TrailerStats {
  totalTrailers: number;
  activeTrailers: number;
  utilizationRate: number;
  averagePrice: number;
  trailersNeedingMaintenance: number;
  overdueMaintenanceTrailers: number;
}

interface RevenueStats {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueChange: number;
  currentMonthRentals: number;
  lastMonthRentals: number;
}

interface TopTrailer {
  id: string;
  title: string;
  totalRentals: number;
  totalRevenue: number;
}

interface ViewedTrailer {
  id: string;
  title: string;
  views: number;
  featured: boolean;
}

interface UpcomingRental {
  id: string;
  startDate: string;
  endDate: string;
  trailerTitle: string;
  renterName: string;
  totalPrice: number;
  images: Array<{ url: string }>;
}

// Query keys
export const dashboardKeys = {
  all: ['lessor-dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  trailers: () => [...dashboardKeys.all, 'trailers'] as const,
  revenue: () => [...dashboardKeys.all, 'revenue'] as const,
  topPerforming: () => [...dashboardKeys.all, 'top-performing'] as const,
  mostViewed: () => [...dashboardKeys.all, 'most-viewed'] as const,
  upcoming: () => [...dashboardKeys.all, 'upcoming'] as const,
};

// Individual data fetchers
const fetchStats = () => 
  ApiClient.get<{ stats: DashboardStats }>('/api/user/profile/lessor-dashboard/stats');

const fetchTrailerStats = () => 
  ApiClient.get<{ trailerStats: TrailerStats }>('/api/user/profile/lessor-dashboard/trailers');

const fetchRevenueStats = () => 
  ApiClient.get<{ revenueStats: RevenueStats }>('/api/user/profile/lessor-dashboard/revenue');

const fetchTopPerforming = () => 
  ApiClient.get<{ trailers: TopTrailer[] }>('/api/user/profile/lessor-dashboard/top-performing');

const fetchMostViewed = () => 
  ApiClient.get<{ trailers: ViewedTrailer[] }>('/api/user/profile/lessor-dashboard/most-viewed');

const fetchUpcomingRentals = () => 
  ApiClient.get<{ rentals: UpcomingRental[] }>('/api/user/profile/lessor-dashboard/upcoming');

// Main hook with parallel queries
export function useLessorDashboard() {
  const queries = useQueries({
    queries: [
      {
        queryKey: dashboardKeys.stats(),
        queryFn: fetchStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
        select: (data: any) => data.stats,
      },
      {
        queryKey: dashboardKeys.trailers(),
        queryFn: fetchTrailerStats,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data: any) => data.trailerStats,
      },
      {
        queryKey: dashboardKeys.revenue(),
        queryFn: fetchRevenueStats,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data: any) => data.revenueStats,
      },
      {
        queryKey: dashboardKeys.topPerforming(),
        queryFn: fetchTopPerforming,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data: any) => data.trailers,
      },
      {
        queryKey: dashboardKeys.mostViewed(),
        queryFn: fetchMostViewed,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data: any) => data.trailers,
      },
      {
        queryKey: dashboardKeys.upcoming(),
        queryFn: fetchUpcomingRentals,
        staleTime: 2 * 60 * 1000, // 2 minutes for more time-sensitive data
        gcTime: 5 * 60 * 1000,
        select: (data: any) => data.rentals,
      },
    ],
  });

  const [
    statsQuery,
    trailerStatsQuery,
    revenueQuery,
    topPerformingQuery,
    mostViewedQuery,
    upcomingQuery,
  ] = queries;

  return {
    // Data
    stats: statsQuery.data || null,
    trailerStats: trailerStatsQuery.data || null,
    revenueStats: revenueQuery.data || null,
    topPerformingTrailers: topPerformingQuery.data || [],
    mostViewedTrailers: mostViewedQuery.data || [],
    upcomingRentals: upcomingQuery.data || [],

    // Loading states
    isLoading: queries.some(q => q.isLoading),
    isLoadingStats: statsQuery.isLoading || trailerStatsQuery.isLoading || revenueQuery.isLoading,
    isLoadingTrailers: topPerformingQuery.isLoading || mostViewedQuery.isLoading,
    isLoadingUpcoming: upcomingQuery.isLoading,

    // Error states
    error: queries.find(q => q.error)?.error,
    hasError: queries.some(q => q.isError),

    // Refetch functions
    refetchAll: () => queries.forEach(q => q.refetch()),
    refetchStats: () => {
      statsQuery.refetch();
      trailerStatsQuery.refetch();
      revenueQuery.refetch();
    },
  };
}

// Alternative: Single query hook (if you prefer to keep the monolithic endpoint)
export function useLessorDashboardSingle() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => ApiClient.get('/api/user/profile/lessor-dashboard'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}