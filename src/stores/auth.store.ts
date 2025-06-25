// src/stores/auth.store.ts
"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
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
}

interface AuthStore extends AuthState {
  actions: AuthActions;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      user: null,
      loading: true,
      error: null,
      initialized: false,

      actions: {
        login: async (email: string, password: string) => {
          try {
            set(state => {
              state.loading = true;
              state.error = null;
            });

            const data = await ApiClient.fetch<{ user: User }>('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email, password }),
              cacheConfig: { ttl: 0 },
            });

            localStorage.setItem(
              "userSession",
              JSON.stringify({
                user: data.user,
                expiry: Date.now() + 30 * 60 * 1000,
              })
            );

            set(state => {
              state.user = data.user;
              state.loading = false;
              state.initialized = true;
              state.error = null;
            });

            return data.user;
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

            await ApiClient.fetch('/api/auth/logout', {
              method: 'POST',
              cacheConfig: { ttl: 0 },
            });

            localStorage.removeItem("userSession");
            
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
            
            // Update local storage
            const userSession = localStorage.getItem("userSession");
            if (userSession) {
              const parsedSession = JSON.parse(userSession);
              localStorage.setItem(
                "userSession",
                JSON.stringify({
                  user: response.user,
                  expiry: parsedSession.expiry,
                  profileComplete: true,
                })
              );
            }
            
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

        initializeAuth: () => {
          try {
            const localSession = localStorage.getItem("userSession");
            if (localSession) {
              const parsedSession = JSON.parse(localSession);
              const sessionExpiry = parsedSession.expiry || 0;

              if (sessionExpiry > Date.now()) {
                set(state => {
                  state.user = parsedSession.user;
                  state.loading = false;
                  state.initialized = true;
                });
              } else {
                localStorage.removeItem("userSession");
                set(state => {
                  state.user = null;
                  state.loading = false;
                  state.initialized = true;
                });
              }
            } else {
              set(state => {
                state.user = null;
                state.loading = false;
                state.initialized = true;
              });
            }
          } catch (e) {
            console.warn("Error loading session:", e);
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

// Convenience hook for backward compatibility
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
  };
};