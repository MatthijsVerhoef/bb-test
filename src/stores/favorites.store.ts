// src/stores/favorites.store.ts
"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiClient } from '@/lib/api-client';
import { useAuthStore } from './auth.store';

export interface TrailerSummary {
  id: string;
  title: string;
  city?: string;
  pricePerDay: number;
  mainImage: string;
}

interface FavoritesState {
  items: TrailerSummary[];
  loading: boolean;
}

interface FavoritesActions {
  addFavorite: (trailer: TrailerSummary) => Promise<void>;
  removeFavorite: (trailerId: string) => Promise<void>;
  isFavorite: (trailerId: string) => boolean;
  setFavorites: (favorites: TrailerSummary[]) => void;
  initializeFavorites: () => void;
  syncWithServer: () => Promise<void>;
}

interface FavoritesStore extends FavoritesState {
  actions: FavoritesActions;
}

export const useFavoritesStore = create<FavoritesStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      items: [],
      loading: true,

      actions: {
        addFavorite: async (trailer: TrailerSummary) => {
          const { items } = get();
          const user = useAuthStore.getState().user;
          
          // Skip if already in favorites
          if (items.some(fav => fav.id === trailer.id)) return;
          
          // Optimistically update UI
          set(state => {
            state.items.push(trailer);
          });
          
          // Update local storage
          if (!user) {
            localStorage.setItem('trailerFavorites', JSON.stringify(get().items));
          }
          
          // Sync with server if logged in
          if (user) {
            try {
              await ApiClient.fetch('/api/favorites', {
                method: 'POST',
                body: JSON.stringify({ trailerId: trailer.id }),
                cacheConfig: { ttl: 0 },
              });
            } catch (error) {
              console.error("Error adding favorite to server:", error);
              // Rollback on error
              set(state => {
                state.items = state.items.filter(fav => fav.id !== trailer.id);
              });
              throw error;
            }
          }
        },

        removeFavorite: async (trailerId: string) => {
          const user = useAuthStore.getState().user;
          const previousFavorites = [...get().items];
          
          // Optimistically update UI
          set(state => {
            state.items = state.items.filter(fav => fav.id !== trailerId);
          });
          
          // Update local storage
          if (!user) {
            localStorage.setItem('trailerFavorites', JSON.stringify(get().items));
          }
          
          // Sync with server if logged in
          if (user) {
            try {
              await ApiClient.fetch(`/api/favorites/${trailerId}`, {
                method: 'DELETE',
                cacheConfig: { ttl: 0 },
              });
            } catch (error) {
              console.error("Error removing favorite from server:", error);
              // Rollback on error
              set(state => {
                state.items = previousFavorites;
              });
              throw error;
            }
          }
        },

        isFavorite: (trailerId: string) => {
          return get().items.some(fav => fav.id === trailerId);
        },

        setFavorites: (favorites: TrailerSummary[]) => {
          set(state => {
            state.items = favorites;
            state.loading = false;
          });
        },

        initializeFavorites: () => {
          try {
            const localFavorites = localStorage.getItem('trailerFavorites');
            if (localFavorites) {
              set(state => {
                state.items = JSON.parse(localFavorites);
                state.loading = false;
              });
            } else {
              set(state => {
                state.loading = false;
              });
            }
          } catch (error) {
            console.error("Error loading favorites:", error);
            set(state => {
              state.loading = false;
            });
          }
        },

        syncWithServer: async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          try {
            // Get local favorites
            const localFavorites = localStorage.getItem("trailerFavorites");
            if (localFavorites && JSON.parse(localFavorites).length > 0) {
              // Send local favorites to server for syncing
              await ApiClient.fetch("/api/favorites/sync", {
                method: "POST",
                body: JSON.stringify({
                  favorites: JSON.parse(localFavorites),
                }),
              });
              
              // Clear localStorage after successful sync
              localStorage.removeItem("trailerFavorites");
            }

            // Fetch user's favorites from server
            const data = await ApiClient.fetch<{ favorites: TrailerSummary[] }>("/api/favorites", {
              cacheConfig: { ttl: 300000 }, // 5 minutes
            });
            
            if (data.favorites) {
              set(state => {
                state.items = data.favorites;
                state.loading = false;
              });
            }
          } catch (error) {
            console.error("Error syncing favorites:", error);
            set(state => {
              state.loading = false;
            });
          }
        },
      },
    })),
    {
      name: 'favorites-store',
    }
  )
);

// Convenience hook for backward compatibility
export const useFavorites = () => {
  const { items, loading, actions } = useFavoritesStore();
  
  return {
    favorites: items,
    loading,
    addFavorite: actions.addFavorite,
    removeFavorite: actions.removeFavorite,
    isFavorite: actions.isFavorite,
  };
};