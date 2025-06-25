// app/profiel/page.tsx - Minimal optimization keeping your current setup
"use client";
import { useSearchParams } from "next/navigation";
import SimplifiedUserProfileDashboard from "@/components/profile/SimplifiedUserProfileDashboard";
import { useAuth } from "@/stores/auth.store";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  let tabParam;
  try {
    tabParam = searchParams?.get("tab");
  } catch (e) {
    console.error("Error reading search params:", e);
    tabParam = null;
  }

  if (authLoading || !user) {
    return (
      <div className="container mx-auto py-0 md:py-32 w-[1100px] max-w-full">
        <div className="flex flex-col md:flex-row gap-15">
          <div className="md:w-1/4 min-w-[360px]">
            <div className="bg-white rounded-2xl border py-10 pb-14">
              <div className="px-6">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <Skeleton className="mt-4 w-32 h-6" />
                  <Skeleton className="mt-2 w-24 h-4" />
                  <div className="w-full mt-10 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-start justify-start h-[400px]">
            <Skeleton className="w-[200px] h-8" />
            <Skeleton className="w-[400px] h-5 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // User is guaranteed to exist here due to middleware protection
  return (
    <div key={`profile-${user.id}`} className="px-3 md:px-0">
      <SimplifiedUserProfileDashboard
        user={user}
        initialActiveTab={tabParam || undefined}
      />
    </div>
  );
}
