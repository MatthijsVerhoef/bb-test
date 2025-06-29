"use client";

import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useTransition,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

// Components
import Sidebar from "./Sidebar";
import { CompleteProfileDialog } from "./complete-profile-dialog";
import PersonalInformation from "./common/PersonalInformation";
import MobileOverview from "./mobile-overview";

// Direct imports for frequently used components
import RenterDashboard from "./renter/RenterDashboard";
import RenterHistory from "./renter/RentalHistory";
import LessorHistory from "./lessor/LessorHistory";

// Lazy load heavy components
const LessorDashboard = lazy(() => import("./lessor/LessorDashboard"));
const FavoritesSection = lazy(() => import("./renter/FavoritesSection"));
const TrailerManagement = lazy(() => import("./lessor/TrailerManagement"));
const BusinessInformation = lazy(() => import("./lessor/BusinessInformation"));
const Reviews = lazy(() => import("./common/improved-reviews"));
const CalendarManagement = lazy(() => import("./lessor/CalendarManagement"));

// Generic loading component
const ComponentLoading = memo(() => (
  <div className="space-y-4">
    <Skeleton className="w-48 h-8" />
    <Skeleton className="w-full h-64" />
  </div>
));

ComponentLoading.displayName = "ComponentLoading";

interface UserProfileDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    profilePicture: string | null;
    isVerified: boolean;
    role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
  };
  initialActiveTab?: string;
  initialActiveMode?: string;
}

// Memoized components map for better performance
const CONTENT_COMPONENTS = {
  renter: {
    overview: RenterDashboard,
    rentals: RenterHistory,
    profile: PersonalInformation,
    favorites: FavoritesSection,
    reviews: Reviews,
  },
  lessor: {
    "lessor-dashboard": LessorDashboard,
    listings: TrailerManagement,
    "lessor-rentals": LessorHistory,
    "lessor-calendar": CalendarManagement,
    "lessor-reviews": Reviews,
    business: BusinessInformation,
  },
};

export default function SimplifiedUserProfileDashboard({
  user,
  initialActiveTab,
  initialActiveMode,
}: UserProfileDashboardProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Compute defaults once
  const defaultTab = useMemo(
    () =>
      initialActiveTab ||
      (isMobile
        ? "overview"
        : user?.role === "LESSOR"
        ? "lessor-dashboard"
        : "profile"),
    [initialActiveTab, isMobile, user?.role]
  );

  const defaultMode = useMemo(
    () => initialActiveMode || (user?.role === "LESSOR" ? "lessor" : "renter"),
    [initialActiveMode, user?.role]
  );

  // State
  const [activeMode, setActiveMode] = useState<"renter" | "lessor">(
    defaultMode
  );
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [editProfileInfo, setEditProfileInfo] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Profile completion logic
  const isProfileIncomplete = !user.phone || !user.address || !user.city;

  const profileCompletion = useMemo(() => {
    const requiredFields = [
      user.firstName,
      user.lastName,
      user.phone,
      user.email,
      user.address,
      user.city,
      user.postalCode,
      user.country,
      user.profilePicture,
      user.isVerified,
    ];

    const filledFields = requiredFields.filter(
      (field) => field !== null && field !== undefined && field !== ""
    ).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  }, [user]);

  // Welcome dialog logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    const profileVisited = localStorage.getItem("buurbak-profile-visited");
    const welcomeDismissed = localStorage.getItem("buurbak-welcome-dismissed");

    if (isProfileIncomplete && !welcomeDismissed && !profileVisited) {
      setShowWelcomeDialog(true);
    }
  }, [isProfileIncomplete]);

  // Navigation handlers
  const handleModeChange = useCallback(
    (mode: "renter" | "lessor") => {
      startTransition(() => {
        setActiveMode(mode);
        const defaultTabForMode =
          mode === "renter" ? "profile" : "lessor-dashboard";
        setActiveTab(defaultTabForMode);

        const params = new URLSearchParams(searchParams);
        params.set("mode", mode);
        params.set("tab", defaultTabForMode);
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, searchParams, router]
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      startTransition(() => {
        setActiveTab(tab);

        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        if (activeMode) {
          params.set("mode", activeMode);
        }
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, searchParams, router, activeMode]
  );

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcomeDialog(false);
    localStorage.setItem("buurbak-profile-visited", "true");
    window.location.reload();
  }, []);

  // Render mobile overview
  if (activeTab === "overview" && isMobile) {
    return (
      <div className="container mx-auto pt-14 pb-6 md:py-32 w-[1100px] max-w-full">
        <MobileOverview
          user={user}
          profileCompletion={profileCompletion}
          onNavigate={(tab, mode) => {
            if (mode && mode !== activeMode) {
              handleModeChange(mode);
            }
            handleTabChange(tab);
          }}
        />
      </div>
    );
  }

  // Get the component to render
  const getContentComponent = () => {
    if (activeMode === "renter") {
      const Component =
        CONTENT_COMPONENTS.renter[
          activeTab as keyof typeof CONTENT_COMPONENTS.renter
        ];
      if (Component) {
        return (
          <Suspense fallback={<ComponentLoading />}>
            <Component
              user={user}
              userId={user.id}
              editProfileInfo={editProfileInfo}
              setEditProfileInfo={setEditProfileInfo}
              shouldShowBanner={
                isProfileIncomplete &&
                localStorage.getItem("buurbak-welcome-dismissed") === "true"
              }
              role="USER"
            />
          </Suspense>
        );
      }
    } else {
      const Component =
        CONTENT_COMPONENTS.lessor[
          activeTab as keyof typeof CONTENT_COMPONENTS.lessor
        ];
      if (Component) {
        return (
          <Suspense fallback={<ComponentLoading />}>
            <Component user={user} userId={user.id} role="LESSOR" />
          </Suspense>
        );
      }
    }

    // Default fallback
    return (
      <PersonalInformation
        user={user}
        editProfileInfo={editProfileInfo}
        setEditProfileInfo={setEditProfileInfo}
      />
    );
  };

  return (
    <div className="container mx-auto pt-14 pb-6 md:py-32 w-[1100px] max-w-full">
      {showWelcomeDialog && (
        <CompleteProfileDialog
          user={user}
          isWelcome={true}
          autoOpen={true}
          onComplete={handleWelcomeComplete}
        >
          <div />
        </CompleteProfileDialog>
      )}

      <div className="flex flex-col md:flex-row gap-15">
        <div className="hidden md:block md:w-1/4 min-w-[360px]">
          <Sidebar
            user={user}
            profileCompletion={profileCompletion}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            activeMode={activeMode}
            setActiveMode={handleModeChange}
            isLoadingFullData={isPending}
            unreadNotifications={0}
            editProfileInfo={editProfileInfo}
          />
        </div>

        <div className="w-full md:w-3/4">
          {activeTab !== "overview" && isMobile && (
            <div className="mb-6 flex md:hidden">
              <Button
                variant="ghost"
                className="pl-0 bg-[#f7f7f7] flex items-center rounded-full w-12 h-12 hover:text-primary/90"
                onClick={() => {
                  setActiveTab("overview");
                  setActiveMode("renter");
                  router.push("/profiel?tab=overview&mode=renter");
                }}
              >
                <ChevronLeft className="size-6 mr-1" strokeWidth={1.5} />
              </Button>
            </div>
          )}
          {getContentComponent()}
        </div>
      </div>
    </div>
  );
}
