"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface TabData {
  id: string;
  mode: "renter" | "lessor";
  label: string;
}

const TABS_CONFIG: Record<string, TabData> = {
  // Renter tabs
  overview: {
    id: "overview",
    mode: "renter",
    label: "Overview",
  },
  profile: {
    id: "profile",
    mode: "renter",
    label: "Profile",
  },
  rentals: {
    id: "rentals",
    mode: "renter",
    label: "Rental History",
  },
  favorites: {
    id: "favorites",
    mode: "renter",
    label: "Favorites",
  },
  reviews: {
    id: "reviews",
    mode: "renter",
    label: "Reviews",
  },

  // Lessor tabs
  "lessor-dashboard": {
    id: "lessor-dashboard",
    mode: "lessor",
    label: "Dashboard",
  },
  listings: {
    id: "listings",
    mode: "lessor",
    label: "Listings",
  },
  "lessor-rentals": {
    id: "lessor-rentals",
    mode: "lessor",
    label: "Rental History",
  },
  "lessor-calendar": {
    id: "lessor-calendar",
    mode: "lessor",
    label: "Calendar",
  },
  "lessor-reviews": {
    id: "lessor-reviews",
    mode: "lessor",
    label: "Reviews",
  },
  business: {
    id: "business",
    mode: "lessor",
    label: "Business Info",
  },
};

export function useProfileTabs(
  initialTab: string = "profile",
  initialMode: "renter" | "lessor" = "renter"
) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL or defaults
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return tabParam && TABS_CONFIG[tabParam] ? tabParam : initialTab;
  });

  const [activeMode, setActiveMode] = useState<"renter" | "lessor">(() => {
    const modeParam = searchParams.get("mode") as "renter" | "lessor" | null;
    if (modeParam && (modeParam === "renter" || modeParam === "lessor")) {
      return modeParam;
    }
    const tabParam = searchParams.get("tab");
    if (tabParam && TABS_CONFIG[tabParam]) {
      return TABS_CONFIG[tabParam].mode;
    }
    return initialMode;
  });

  // State for tab loading
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());

  // Update URL when tab or mode changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", activeTab);
    newParams.set("mode", activeMode);

    const newUrl = `/profiel?${newParams.toString()}`;
    if (window.location.search !== `?${newParams.toString()}`) {
      router.push(newUrl, { scroll: false });
    }
  }, [activeTab, activeMode, searchParams, router]);

  // Handle tab change
  const handleTabChange = useCallback(
    (tabId: string) => {
      if (!TABS_CONFIG[tabId]) return;

      setActiveTab(tabId);

      // If tab is for a different mode, update mode too
      if (TABS_CONFIG[tabId].mode !== activeMode) {
        setActiveMode(TABS_CONFIG[tabId].mode);
      }
    },
    [activeMode]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (mode: "renter" | "lessor") => {
      if (mode === activeMode) return;

      setActiveMode(mode);

      // Find the first tab for this mode
      const firstTabForMode = Object.values(TABS_CONFIG).find(
        (tab) => tab.mode === mode
      );

      if (firstTabForMode) {
        setActiveTab(firstTabForMode.id);
      }
    },
    [activeMode]
  );

  // Simple loading state management
  const setTabLoading = useCallback((tabId: string, isLoading: boolean) => {
    setLoadingTabs((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(tabId);
      } else {
        newSet.delete(tabId);
      }
      return newSet;
    });
  }, []);

  return {
    activeTab,
    activeMode,
    handleTabChange,
    handleModeChange,
    isTabLoading: (tabId: string) => loadingTabs.has(tabId),
    setTabLoading,
    getTabData: (tabId: string) => TABS_CONFIG[tabId],
    allTabsForMode: (mode: "renter" | "lessor") =>
      Object.values(TABS_CONFIG)
        .filter((tab) => tab.mode === mode)
        .map((tab) => tab.id),
  };
}
