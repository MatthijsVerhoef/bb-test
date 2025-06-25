"use client";

import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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

  // Initialize stores on mount
  useEffect(() => {
    console.log("[AppProvider] Initializing stores...");
    initializeAuth();
    initializeFavorites();
  }, [initializeAuth, initializeFavorites]);

  // Handle user-dependent actions
  useEffect(() => {
    console.log("[AppProvider] User changed:", user);
    if (user) {
      console.log("[AppProvider] User logged in, syncing data...");
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
