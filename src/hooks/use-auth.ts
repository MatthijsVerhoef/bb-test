import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ApiClient } from "@/lib/api-client";

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  bio?: string;
}

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const user = useMemo(() => {
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      phone: session.user.phone,
      address: session.user.address,
      city: session.user.city,
      postalCode: session.user.postalCode,
      country: session.user.country,
      bio: session.user.bio,
      role: session.user.role,
      isVerified: session.user.isVerified,
    };
  }, [session]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Redirect or return success
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await signOut({ 
      redirect: true,
      callbackUrl: '/'
    });
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    try {
      const response = await ApiClient.post<{ user: any }>('/api/auth/update-profile', data, {
        cacheConfig: { ttl: 0 } // Don't cache profile updates
      });

      // Update the session with new data
      await update({
        ...session?.user,
        ...response.user,
      });

      // Clear any cached user data
      ApiClient.clearCache(['/api/auth/me']);

      return response.user;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }, [session, update]);

  const refreshSession = useCallback(async () => {
    await update();
  }, [update]);

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    login,
    logout,
    updateProfile,
    refreshSession,
  };
}