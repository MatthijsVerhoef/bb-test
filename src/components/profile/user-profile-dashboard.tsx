"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileTabs } from "@/hooks/useProfileTabs";
import Sidebar from "./Sidebar";
import RenterDashboard from "./renter/RenterDashboard";
import LessorDashboard from "./lessor/LessorDashboard";
import PersonalInformation from "./common/PersonalInformation";
import FavoritesSection from "./renter/FavoritesSection";
import TrailerManagement from "./lessor/TrailerManagement";
import BusinessInformation from "./lessor/BusinessInformation";
import Reviews from "./common/improved-reviews";
import LessorHistory from "./lessor/LessorHistory";
import LessorCalendarPage from "./lessor/LessorCalendarPage";
import RenterHistory from "./renter/RentalHistory";
import {
  prefetchLessorCalendarData,
  LESSOR_CALENDAR_KEYS,
} from "@/hooks/useLessorCalendarData";

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

export default function UserProfileDashboard({
  user,
  initialActiveTab,
}: UserProfileDashboardProps) {
  const queryClient = useQueryClient();

  const initialMode =
    user.role === "LESSOR" || user.role === "ADMIN" ? "lessor" : "renter";

  const defaultTab = !initialActiveTab
    ? initialMode === "lessor"
      ? "lessor-dashboard"
      : "overview"
    : initialActiveTab;

  const { activeTab, activeMode, handleTabChange, handleModeChange } =
    useProfileTabs(defaultTab, initialMode);

  const [editProfileInfo, setEditProfileInfo] = useState(false);

  const canAccessLessorMode = user.role === "LESSOR" || user.role === "ADMIN";

  useEffect(() => {
    if (canAccessLessorMode) {
      const prefetchData = async () => {
        try {
          await prefetchLessorCalendarData(queryClient);
          console.log("Lessor calendar data prefetched successfully");
        } catch (error) {
          console.error(
            "Background prefetch of lessor calendar data failed:",
            error
          );
        }
      };

      // Start the prefetch
      prefetchData();

      // Set up a refresh interval for background updates
      const intervalId = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: LESSOR_CALENDAR_KEYS.data(),
        });
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [canAccessLessorMode, queryClient, user.id]);

  // Calculate profile completion
  const calculateProfileCompletion = () => {
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
  };

  // Render the appropriate content based on active tab and mode
  const renderContent = () => {
    const components = {
      // Renter tabs
      overview: <RenterDashboard />,
      profile: (
        <PersonalInformation
          user={user}
          editProfileInfo={editProfileInfo}
          setEditProfileInfo={setEditProfileInfo}
        />
      ),
      rentals: <RenterHistory userId={user.id} />,
      favorites: <FavoritesSection />,
      reviews: <Reviews role="USER" />,
      settings: <div>hey</div>,

      // Lessor tabs
      "lessor-dashboard": <LessorDashboard />,
      listings: <TrailerManagement />,
      "lessor-rentals": <LessorHistory userId={user.id} />,
      "lessor-calendar": <LessorCalendarPage userId={user.id} />,
      "lessor-reviews": <Reviews role="LESSOR" />,
      business: <BusinessInformation user={user} />,
    };

    // Return the component for the active tab, or a default
    return components[activeTab] || components["overview"];
  };

  return (
    <div className="container mx-auto py-0 md:py-32 w-[1130px] max-w-[100vw]">
      <div className="flex flex-col md:flex-row gap-15">
        {/* Sidebar */}
        <div className="md:w-1/4 min-w-[360px]">
          <Sidebar
            user={user}
            profileCompletion={calculateProfileCompletion()}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            activeMode={canAccessLessorMode ? activeMode : "renter"}
            setActiveMode={canAccessLessorMode ? handleModeChange : () => {}}
            editProfileInfo={editProfileInfo}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}
