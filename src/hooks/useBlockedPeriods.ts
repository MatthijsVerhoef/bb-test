import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface BlockedPeriod {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  allDay: boolean;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  trailerId?: string;
  trailer?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
  belongsToThisTrailersOwner?: boolean;
  isGlobal?: boolean;
  trailerSpecific?: boolean;
  userId?: string;
  isTemporaryBlock?: boolean; // Flag for temporary blocks during payment process
  isConfirmedRental?: boolean; // Flag for blocks that are confirmed rentals
}

export interface CreateBlockedPeriodData {
  startDate: string;
  endDate: string;
  reason?: string;
  allDay?: boolean;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  trailerId?: string;
}

const BLOCKED_PERIODS_KEY = ['blocked-periods'];

export function useBlockedPeriods() {
  const queryClient = useQueryClient();

  // Fetch blocked periods
  const {
    data: blockedPeriodsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: BLOCKED_PERIODS_KEY,
    queryFn: async () => {
      const response = await fetch('/api/user/profile/lessor-calendar/blocked-periods');
      if (!response.ok) {
        throw new Error('Failed to fetch blocked periods');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const blockedPeriods: BlockedPeriod[] = blockedPeriodsData?.blockedPeriods || [];

  // Create blocked period mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateBlockedPeriodData) => {
      const response = await fetch('/api/user/profile/lessor-calendar/blocked-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create blocked period');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_PERIODS_KEY });
    },
  });

  // Delete blocked period mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user/profile/lessor-calendar/blocked-periods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete blocked period');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_PERIODS_KEY });
    },
  });

  return {
    blockedPeriods,
    isLoading,
    error,
    refetch,
    createBlockedPeriod: createMutation.mutate,
    deleteBlockedPeriod: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    deleteError: deleteMutation.error,
  };
}