"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import { CompleteProfileDialog } from "./complete-profile-dialog";
import PersonalInformation from "./common/PersonalInformation";
import MobileOverview from "./mobile-overview";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import ReviewSkeleton from "./common/ReviewSkeleton";
import LessorHistory from "./lessor/LessorHistory";

const ComponentSkeleton = ({
  type,
}: {
  type: "dashboard" | "list" | "grid" | "form" | "calendar";
}) => {
  switch (type) {
    case "dashboard":
      return (
        <div className="space-y-6">
          <Skeleton className="w-48 h-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      );
    case "list":
      return (
        <div className="space-y-4">
          <Skeleton className="w-40 h-6" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      );
    case "grid":
      return (
        <div className="space-y-4">
          <Skeleton className="w-40 h-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      );
    case "form":
      return (
        <div className="space-y-6">
          <Skeleton className="w-56 h-8" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
            ))}
          </div>
        </div>
      );
    case "calendar":
      return (
        <div className="space-y-6">
          <Skeleton className="w-40 h-8" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      );
    default:
      return <Skeleton className="w-full h-64" />;
  }
};

const RenterDashboard = dynamic(() => import("./renter/RenterDashboard"), {
  loading: () => <ComponentSkeleton type="dashboard" />,
  ssr: false,
});

const LessorDashboard = dynamic(() => import("./lessor/LessorDashboard"), {
  loading: () => <ComponentSkeleton type="dashboard" />,
  ssr: false,
});

const FavoritesSection = dynamic(() => import("./renter/FavoritesSection"), {
  loading: () => <ComponentSkeleton type="grid" />,
  ssr: false,
});

const TrailerManagement = dynamic(() => import("./lessor/TrailerManagement"), {
  loading: () => <ComponentSkeleton type="list" />,
  ssr: false,
});

const BusinessInformation = dynamic(
  () => import("./lessor/BusinessInformation"),
  {
    loading: () => <ComponentSkeleton type="form" />,
    ssr: false,
  }
);

// Import the improved version that has proper animations and loading states
const Reviews = dynamic(() => import("./common/improved-reviews"), {
  loading: () => <ReviewSkeleton count={3} includeResponse={true} />,
  ssr: false,
});

// const LessorHistory = dynamic(() => import("./lessor/LessorHistory"), {
//   loading: () => <ComponentSkeleton type="list" />,
//   ssr: false,
// });

const CalendarManagement = dynamic(
  () => import("./lessor/CalendarManagement"),
  {
    loading: () => <ComponentSkeleton type="calendar" />,
    ssr: false,
  }
);

const RenterHistory = dynamic(() => import("./renter/RentalHistory"), {
  loading: () => <ComponentSkeleton type="list" />,
  ssr: false,
});

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
}

export default function SimplifiedUserProfileDashboard({
  user,
  initialActiveTab,
}: UserProfileDashboardProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  // Set correct defaults from user role - on mobile, start with overview if no tab specified
  const defaultTab =
    initialActiveTab ||
    (isMobile
      ? "overview"
      : user?.role === "LESSOR"
      ? "lessor-dashboard"
      : "profile");
  const defaultMode = user?.role === "LESSOR" ? "lessor" : "renter";

  // State management
  const [activeMode, setActiveMode] = useState<"renter" | "lessor">(
    defaultMode
  );
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [lessorHistoryData, setLessorHistoryData] = useState(null);
  const [isLoadingLessorHistory, setIsLoadingLessorHistory] = useState(false);

  const preloadLessorHistory = async () => {
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
  };

  useEffect(() => {
    const handleProfileTabChange = (event: CustomEvent) => {
      const { tab, mode } = event.detail;

      if (mode && mode !== activeMode) {
        setActiveMode(mode);
      }
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
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

  // Create a direct mode change handler
  const handleModeChange = (mode: "renter" | "lessor") => {
    setActiveMode(mode);

    // Also set the appropriate tab for this mode
    const defaultTabForMode =
      mode === "renter" ? "profile" : "lessor-dashboard";
    setActiveTab(defaultTabForMode);

    // Update URL using Next.js router
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("tab", defaultTabForMode);
    router.push(`/profiel?${params.toString()}`, { shallow: true });
  };

  // Create a direct tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Update URL using Next.js router
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (activeMode) {
      params.set("mode", activeMode);
    }
    router.push(`/profiel?${params.toString()}`, { shallow: true });
  };

  // Local state
  const [editProfileInfo, setEditProfileInfo] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [hasVisitedProfile, setHasVisitedProfile] = useState(false);

  // Check if profile is incomplete (missing key fields)
  const isProfileIncomplete = !user.phone || !user.address || !user.city;

  // Check if this is the first time visiting the profile
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

  const handleWelcomeComplete = () => {
    setShowWelcomeDialog(false);
    setHasVisitedProfile(true);
    // Optionally refresh the page to show updated profile data
    window.location.reload();
  };

  // Check if we should show the banner
  const shouldShowBanner =
    isProfileIncomplete &&
    (hasVisitedProfile ||
      (typeof window !== "undefined" &&
        localStorage.getItem("buurbak-welcome-dismissed") === "true"));

  // Calculate profile completion percentage
  function calculateProfileCompletion() {
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
  }

  const profileCompletion = calculateProfileCompletion();

  const renderContent = () => {
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
          return <RenterHistory userId={user.id} />;

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
          return <FavoritesSection />;

        case "reviews":
          return <Reviews role="USER" />;

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
          return <LessorDashboard />;

        case "listings":
          return <TrailerManagement />;

        case "lessor-rentals":
          return (
            <LessorHistory
              userId={user.id}
              initialRentals={lessorHistoryData?.rentals || []}
              initialCounts={
                lessorHistoryData?.counts || {
                  upcoming: 0,
                  current: 0,
                  past: 0,
                }
              }
              isLoading={false}
            />
          );

        case "lessor-calendar":
          return <CalendarManagement userId={user.id} />;

        case "lessor-reviews":
          return <Reviews role="LESSOR" />;

        case "business":
          return <BusinessInformation user={user} />;

        default:
          return <LessorDashboard />;
      }
    }
  };

  return (
    <div className="container mx-auto pt-14 pb-6 md:py-32 w-[1100px] max-w-full">
      {/* Welcome Dialog for First-time Visitors */}
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
        {/* Left sidebar - Hidden on mobile, shown on md+ */}
        <div className="hidden md:block md:w-1/4 min-w-[360px]">
          <Sidebar
            user={user}
            profileCompletion={profileCompletion}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            activeMode={activeMode}
            setActiveMode={handleModeChange}
            isLoadingFullData={false}
            unreadNotifications={0}
            editProfileInfo={editProfileInfo}
          />
        </div>

        {/* Main content area - Full width on mobile, 3/4 on md+ */}
        <div className="w-full md:w-3/4">
          {activeTab !== "overview" && (
            <div className="mb-6 flex md:hidden">
              <Button
                variant="ghost"
                className="pl-0 bg-[#f7f7f7] flex items-center rounded-full w-12 h-12 hover:text-primary/90"
                onClick={() => {
                  setActiveTab("overview");
                  setActiveMode("renter");
                  router.push("/profiel?tab=overview&mode=renter", {
                    shallow: true,
                  });
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
