"use client";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/auth.store";
import { useFavoritesStore } from "@/stores/favorites.store";
import { useNotificationsStore } from "@/stores/notifications.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
      refetchOnMount: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const initializeAuth = useAuthStore((state) => state.actions.initializeAuth);
  const initializeFavorites = useFavoritesStore(
    (state) => state.actions.initializeFavorites
  );
  const syncFavorites = useFavoritesStore(
    (state) => state.actions.syncWithServer
  );
  const fetchNotifications = useNotificationsStore(
    (state) => state.actions.fetchNotifications
  );
  const user = useAuthStore((state) => state.user);

  // Initialize stores based on session status
  useEffect(() => {
    // Only initialize auth if session is loaded
    if (status === "loading") {
      // Still loading, don't do anything
      return;
    }

    if (status === "authenticated" && session) {
      // User is authenticated, initialize auth store
      initializeAuth();
    } else if (status === "unauthenticated") {
      // User is not authenticated, just mark as initialized without fetching
      useAuthStore.setState({
        user: null,
        loading: false,
        initialized: true,
        error: null,
      });
    }

    // Always initialize favorites (can work offline)
    initializeFavorites();
  }, [status, session, initializeAuth, initializeFavorites]);

  // Handle user-dependent actions
  useEffect(() => {
    if (user) {
      syncFavorites();
      fetchNotifications();
    }
  }, [user, syncFavorites, fetchNotifications]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
