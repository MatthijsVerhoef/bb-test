"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { signIn, signOut, getSession } from 'next-auth/react';
import { ApiClient } from '@/lib/api-client';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  profilePicture?: string;
  bio?: string;
  role: string;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ user: User; message: string }>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  refreshUser: () => Promise<void>;
}

interface AuthStore extends AuthState {
  actions: AuthActions;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      user: null,
      loading: false, // Changed from true to false
      error: null,
      initialized: false,

      actions: {
        login: async (email: string, password: string) => {
          try {
            set(state => {
              state.loading = true;
              state.error = null;
            });

            // Use NextAuth signIn
            const result = await signIn('credentials', {
              email,
              password,
              redirect: false,
            });

            if (result?.error) {
              throw new Error(result.error);
            }

            // Get user data after successful login
            const userData = await ApiClient.fetch<{ user: User }>('/api/auth/me', {
              method: 'GET',
              cacheConfig: { ttl: 0 },
            });

            set(state => {
              state.user = userData.user;
              state.loading = false;
              state.initialized = true;
              state.error = null;
            });

            return userData.user;
          } catch (error: any) {
            set(state => {
              state.loading = false;
              state.error = error.message;
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            set(state => {
              state.loading = true;
            });

            // Use NextAuth signOut
            await signOut({ redirect: false });
            
            set(state => {
              state.user = null;
              state.loading = false;
              state.error = null;
            });
          } catch (error: any) {
            set(state => {
              state.loading = false;
              state.error = error.message;
            });
            throw error;
          }
        },

        register: async (email: string, password: string, firstName?: string, lastName?: string) => {
          try {
            set(state => {
              state.loading = true;
              state.error = null;
            });

            const data = await ApiClient.fetch<{ user: User; message: string }>('/api/auth/register', {
              method: 'POST',
              body: JSON.stringify({ email, password, firstName, lastName }),
              cacheConfig: { ttl: 0 },
            });

            set(state => {
              state.loading = false;
              state.error = null;
            });

            return data;
          } catch (error: any) {
            set(state => {
              state.loading = false;
              state.error = error.message;
            });
            throw error;
          }
        },

        updateProfile: async (userData: Partial<User>) => {
          try {
            set(state => {
              state.loading = true;
              state.error = null;
            });
            
            const response = await ApiClient.fetch<{ user: User }>('/api/auth/update-profile', {
              method: 'POST',
              body: JSON.stringify(userData),
              cacheConfig: { ttl: 0 },
            });
            
            set(state => {
              state.user = response.user;
              state.loading = false;
              state.error = null;
            });
            
            return response.user;
          } catch (error: any) {
            set(state => {
              state.loading = false;
              state.error = error.message || "Failed to update profile";
            });
            throw error;
          }
        },

        requestPasswordReset: async (email: string) => {
          await ApiClient.fetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
            cacheConfig: { ttl: 0 },
          });
        },

        resetPassword: async (token: string, newPassword: string) => {
          await ApiClient.fetch('/api/auth/reset-password/confirm', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
            cacheConfig: { ttl: 0 },
          });
        },

        resendVerificationEmail: async (email: string) => {
          await ApiClient.fetch('/api/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
            cacheConfig: { ttl: 0 },
          });
        },

        clearError: () => {
          set(state => {
            state.error = null;
          });
        },

        refreshUser: async () => {
          try {
            // First check if there's a session
            const session = await getSession();
            
            if (!session) {
              set(state => {
                state.user = null;
                state.loading = false;
                state.initialized = true;
              });
              return;
            }

            const userData = await ApiClient.fetch<{ user: User }>('/api/auth/me', {
              method: 'GET',
              cacheConfig: { ttl: 0 },
            });

            set(state => {
              state.user = userData.user;
              state.loading = false;
              state.initialized = true;
            });
          } catch (error) {
            set(state => {
              state.user = null;
              state.loading = false;
              state.initialized = true;
            });
          }
        },

        initializeAuth: async () => {
          try {
            // First check if there's a session
            const session = await getSession();
            
            // If no session, just mark as initialized without fetching
            if (!session) {
              set(state => {
                state.user = null;
                state.loading = false;
                state.initialized = true;
              });
              return;
            }

            // Only fetch user data if there's a session
            const userData = await ApiClient.fetch<{ user: User }>('/api/auth/me', {
              method: 'GET',
              cacheConfig: { ttl: 0 },
            });

            set(state => {
              state.user = userData.user;
              state.loading = false;
              state.initialized = true;
            });
          } catch (error) {
            set(state => {
              state.user = null;
              state.loading = false;
              state.initialized = true;
            });
          }
        },
      },
    })),
    {
      name: 'auth-store',
    }
  )
);

// Convenience hook
export const useAuth = () => {
  const { user, loading, error, initialized, actions } = useAuthStore();
  
  return {
    user,
    loading,
    error,
    initialized,
    login: actions.login,
    logout: actions.logout,
    register: actions.register,
    updateProfile: actions.updateProfile,
    requestPasswordReset: actions.requestPasswordReset,
    resetPassword: actions.resetPassword,
    resendVerificationEmail: actions.resendVerificationEmail,
    clearError: actions.clearError,
    refreshUser: actions.refreshUser,
  };
};