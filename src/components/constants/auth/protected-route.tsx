"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    // If user doesn't have required role, redirect to appropriate dashboard
    if (
      !loading &&
      user &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      // Redirect based on role
      switch (user.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "LESSOR":
          router.push("/lessor-dashboard");
          break;
        case "SUPPORT":
          router.push("/support-dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    }
  }, [user, loading, router, requiredRoles]);

  // If loading or redirecting, show loading state
  if (
    loading ||
    !user ||
    (requiredRoles.length > 0 && !requiredRoles.includes(user.role))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
}
