"use client";

import { useEffect } from "react";
import SimplifiedUserProfileDashboard from "@/components/profile/SimplifiedUserProfileDashboard";
import { useAuthStore } from "@/stores/auth.store";

interface ProfileClientProps {
  user: any;
  initialTab?: string;
  initialMode?: string;
  initialData?: any;
}

export default function ProfileClient({
  user,
  initialTab,
  initialMode,
  initialData,
}: ProfileClientProps) {
  const { actions } = useAuthStore();

  // Sync server user data with client store
  useEffect(() => {
    actions.initializeAuth();
  }, []);

  return (
    <SimplifiedUserProfileDashboard
      user={user}
      initialActiveTab={initialTab}
      initialActiveMode={initialMode}
      initialData={initialData}
    />
  );
}
