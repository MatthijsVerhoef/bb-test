"use client";

import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import Sidebar from "./Sidebar";
import { CompleteProfileDialog } from "./complete-profile-dialog";
import PersonalInformation from "./common/PersonalInformation";
import MobileOverview from "./mobile-overview";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

// Direct imports for frequently used components
import RenterDashboard from "./renter/RenterDashboard";
import RenterHistory from "./renter/RentalHistory";
import LessorHistory from "./lessor/LessorHistory";

// Lazy load the main lessor dashboard with preload
const LessorDashboard = lazy(() => {
  // Preload related components
  import("./lessor/TrailerManagement");
  import("./lessor/CalendarManagement");
  return import("./lessor/LessorDashboard");
});

// Lazy load other components
const FavoritesSection = lazy(() => import("./renter/FavoritesSection"));
const TrailerManagement = lazy(() => import("./lessor/TrailerManagement"));
const BusinessInformation = lazy(() => import("./lessor/BusinessInformation"));
const Reviews = lazy(() => import("./common/improved-reviews"));
const CalendarManagement = lazy(() => import("./lessor/CalendarManagement"));

// Generic loading component
const ComponentLoading = () => (
  <div className="space-y-4">
    <Skeleton className="w-48 h-8" />
    <Skeleton className="w-full h-64" />
  </div>
);

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
  initialData?: any;
}

// Tab preload map
const TAB_PRELOADS: Record<string, () => void> = {
  favorites: () => import("./renter/FavoritesSection"),
  "lessor-calendar": () => import("./lessor/CalendarManagement"),
  business: () => import("./lessor/BusinessInformation"),
  listings: () => import("./lessor/TrailerManagement"),
  reviews: () => import("./common/improved-reviews"),
  "lessor-reviews": () => import("./common/improved-reviews"),
};

export default function SimplifiedUserProfileDashboard({
  user,
  initialActiveTab,
  initialActiveMode,
  initialData,
}: UserProfileDashboardProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Set correct defaults from user role
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

  // State management
  const [activeMode, setActiveMode] = useState<"renter" | "lessor">(
    defaultMode
  );
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [lessorHistoryData, setLessorHistoryData] = useState(
    initialData?.lessorHistory || null
  );
  const [lessorDashboardData, setLessorDashboardData] = useState(
    initialData?.lessorDashboard || null
  );
  const [isLoadingLessorHistory, setIsLoadingLessorHistory] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Prefetch strategy for lessors
  useEffect(() => {
    if (user?.role === "LESSOR" && !lessorDashboardData) {
      // Prefetch dashboard data for lessors
      fetchLessorDashboard();
    }
  }, [user?.role]);

  // Preload components based on user interaction patterns
  useEffect(() => {
    if (user?.role === "LESSOR") {
      // Preload common lessor components
      import("./lessor/LessorDashboard");
      import("./lessor/TrailerManagement");

      // Preload next likely tab based on current tab
      if (activeTab === "lessor-dashboard") {
        import("./lessor/LessorHistory");
      }
    } else {
      // Preload common renter components
      import("./renter/FavoritesSection");
    }
  }, [user?.role, activeTab]);

  const fetchLessorDashboard = useCallback(async () => {
    if (lessorDashboardData || isLoadingDashboard) return;

    setIsLoadingDashboard(true);
    try {
      const response = await fetch("/api/user/profile/lessor-dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      const data = await response.json();
      setLessorDashboardData(data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [lessorDashboardData, isLoadingDashboard]);

  const preloadLessorHistory = useCallback(async () => {
    if (lessorHistoryData || isLoadingLessorHistory) return;

    setIsLoadingLessorHistory(true);
    try {
      const response = await fetch("/api/user/profile/lessor-history");
      const data = await response.json();
      setLessorHistoryData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLessorHistory(false);
    }
  }, [lessorHistoryData, isLoadingLessorHistory]);

  // Listen for external navigation events
  useEffect(() => {
    const handleProfileTabChange = (event: CustomEvent) => {
      const { tab, mode } = event.detail;

      startTransition(() => {
        if (mode && mode !== activeMode) {
          setActiveMode(mode);
        }
        if (tab && tab !== activeTab) {
          setActiveTab(tab);
        }
      });
    };

    window.addEventListener(
      "profileTabChange",
      handleProfileTabChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "profileTabChange",
        handleProfileTabChange as EventListener
      );
    };
  }, [activeTab, activeMode]);

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
      // Preload component if needed
      if (TAB_PRELOADS[tab]) {
        TAB_PRELOADS[tab]();
      }

      startTransition(() => {
        setActiveTab(tab);

        // Preload data for specific tabs
        if (tab === "lessor-rentals" && !lessorHistoryData) {
          preloadLessorHistory();
        } else if (tab === "lessor-dashboard" && !lessorDashboardData) {
          fetchLessorDashboard();
        }

        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        if (activeMode) {
          params.set("mode", activeMode);
        }
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [
      pathname,
      searchParams,
      router,
      activeMode,
      lessorHistoryData,
      lessorDashboardData,
      preloadLessorHistory,
      fetchLessorDashboard,
    ]
  );

  // Local state
  const [editProfileInfo, setEditProfileInfo] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [hasVisitedProfile, setHasVisitedProfile] = useState(false);

  const isProfileIncomplete = !user.phone || !user.address || !user.city;

  useEffect(() => {
    const profileVisited = localStorage.getItem("buurbak-profile-visited");
    const welcomeDismissed = localStorage.getItem("buurbak-welcome-dismissed");
    const hasVisited = profileVisited === "true";
    const hasSeenWelcome = welcomeDismissed === "true";

    setHasVisitedProfile(hasVisited);

    if (isProfileIncomplete && !hasSeenWelcome && !hasVisited) {
      setShowWelcomeDialog(true);
    }
  }, [isProfileIncomplete]);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcomeDialog(false);
    setHasVisitedProfile(true);
    window.location.reload();
  }, []);

  const shouldShowBanner = useMemo(
    () =>
      isProfileIncomplete &&
      (hasVisitedProfile ||
        (typeof window !== "undefined" &&
          localStorage.getItem("buurbak-welcome-dismissed") === "true")),
    [isProfileIncomplete, hasVisitedProfile]
  );

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

  const renderContent = useCallback(() => {
    if (activeTab === "overview" && isMobile) {
      return (
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
      );
    }

    // Renter mode content
    if (activeMode === "renter") {
      switch (activeTab) {
        case "overview":
          return <RenterDashboard user={user} />;

        case "rentals":
          return (
            <RenterHistory
              userId={user.id}
              initialRentals={initialData?.rentals || []}
            />
          );

        case "profile":
          return (
            <PersonalInformation
              user={user}
              editProfileInfo={editProfileInfo}
              setEditProfileInfo={setEditProfileInfo}
              shouldShowBanner={shouldShowBanner}
            />
          );

        case "favorites":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <FavoritesSection />
            </Suspense>
          );

        case "reviews":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <Reviews role="USER" />
            </Suspense>
          );

        default:
          return (
            <PersonalInformation
              user={user}
              editProfileInfo={editProfileInfo}
              setEditProfileInfo={setEditProfileInfo}
            />
          );
      }
    }

    // Lessor mode content
    if (activeMode === "lessor") {
      switch (activeTab) {
        case "lessor-dashboard":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <LessorDashboard
                initialData={
                  lessorDashboardData || initialData?.lessorDashboard
                }
              />
            </Suspense>
          );

        case "listings":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <TrailerManagement />
            </Suspense>
          );

        case "lessor-rentals":
          return (
            <LessorHistory
              userId={user.id}
              initialRentals={
                lessorHistoryData?.rentals ||
                initialData?.lessorHistory?.rentals ||
                []
              }
              initialCounts={
                lessorHistoryData?.counts ||
                initialData?.lessorHistory?.counts || {
                  upcoming: 0,
                  current: 0,
                  past: 0,
                }
              }
              isLoading={
                isLoadingLessorHistory &&
                !lessorHistoryData &&
                !initialData?.lessorHistory
              }
            />
          );

        case "lessor-calendar":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <CalendarManagement userId={user.id} />
            </Suspense>
          );

        case "lessor-reviews":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <Reviews role="LESSOR" />
            </Suspense>
          );

        case "business":
          return (
            <Suspense fallback={<ComponentLoading />}>
              <BusinessInformation user={user} />
            </Suspense>
          );

        default:
          return (
            <Suspense fallback={<ComponentLoading />}>
              <LessorDashboard
                initialData={
                  lessorDashboardData || initialData?.lessorDashboard
                }
              />
            </Suspense>
          );
      }
    }
  }, [
    activeTab,
    activeMode,
    isMobile,
    user,
    profileCompletion,
    editProfileInfo,
    shouldShowBanner,
    lessorHistoryData,
    lessorDashboardData,
    initialData,
    isLoadingLessorHistory,
    handleModeChange,
    handleTabChange,
  ]);

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
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
