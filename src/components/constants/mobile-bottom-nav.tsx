"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Heart,
  UserCircle,
  Calendar,
  CalendarDays,
  Star,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuth } from "@/stores/auth.store";
import { useChat } from "@/hooks/useChat";
import AuthDialog from "@/components/constants/auth/auth-dialog";
import { useTranslation } from "@/lib/i18n/client";

// SVG component for trailer icon
const TrailerIcon = ({ className = "" }) => (
  <svg
    width={18}
    viewBox="0 0 27 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12.4994H13.5M21 12.4994V5.44549M21 12.4994H25.8C25.9105 12.4994 26 12.4099 26 12.2994V9.1653M13.5 12.4994V12.4994C13.5 11.1187 12.3807 9.99883 11 9.99883V9.99883C9.61929 9.99883 8.5 11.1187 8.5 12.4994V12.4994M13.5 12.4994V12.4994C13.5 13.8801 12.3807 15 11 15V15C9.61929 15 8.5 13.8801 8.5 12.4994V12.4994M8.5 12.4994H3C1.89543 12.4994 1 11.604 1 10.4994V5.44549M1 5.44549V2.2C1 1.53726 1.53726 1 2.2 1H19.8C20.4627 1 21 1.53726 21 2.2V5.44549M1 5.44549H21" />
  </svg>
);

// Profile Sidebar Drawer Component
const ProfileSidebarDrawer = ({ user }: { user: any }) => {
  // Get current URL params to show current state
  const [currentTab, setCurrentTab] = useState("profile");
  const [currentMode, setCurrentMode] = useState<"renter" | "lessor">("renter");

  // Initialize from URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab") || "profile";
      const mode =
        (urlParams.get("mode") as "renter" | "lessor") ||
        (user?.role === "LESSOR" ? "lessor" : "renter");
      setCurrentTab(tab);
      setCurrentMode(mode);
    }
  }, [user]);

  const canAccessLessorMode = user?.role === "LESSOR" || user?.role === "ADMIN";

  // Handle tab switching using custom events
  const handleTabSwitch = (tab: string, mode?: "renter" | "lessor") => {
    // Update local state
    setCurrentTab(tab);
    if (mode) setCurrentMode(mode);

    // Dispatch custom event for profile component to listen to
    window.dispatchEvent(
      new CustomEvent("profileTabChange", {
        detail: { tab, mode: mode || currentMode },
      })
    );

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    if (mode) url.searchParams.set("mode", mode);
    window.history.replaceState({}, "", url.toString());
  };

  // Handle mode switching
  const handleModeSwitch = (mode: "renter" | "lessor") => {
    setCurrentMode(mode);

    // Switch to appropriate default tab for the mode
    const defaultTab = mode === "renter" ? "profile" : "lessor-dashboard";
    handleTabSwitch(defaultTab, mode);
  };

  // Navigation items for each mode
  const navigationItems = {
    renter: [
      {
        id: "profile",
        label: "Mijn gegevens",
        icon: <User className="h-4 w-4" />,
        mode: "renter" as const,
      },
      {
        id: "rentals",
        label: "Mijn Huurovereenkomsten",
        icon: <CalendarDays className="h-4 w-4" />,
        mode: "renter" as const,
      },
      {
        id: "favorites",
        label: "Favorieten",
        icon: <Heart className="h-4 w-4" />,
        mode: "renter" as const,
      },
      {
        id: "reviews",
        label: "Beoordelingen",
        icon: <Star className="h-4 w-4" />,
        mode: "renter" as const,
      },
    ],
    lessor: [
      {
        id: "lessor-dashboard",
        label: "Dashboard",
        icon: <Briefcase className="h-4 w-4" />,
        mode: "lessor" as const,
      },
      {
        id: "lessor-rentals",
        label: "Boekingen",
        icon: <CalendarDays className="h-4 w-4" />,
        mode: "lessor" as const,
      },
      {
        id: "lessor-calendar",
        label: "Kalender",
        icon: <Calendar className="h-4 w-4" />,
        mode: "lessor" as const,
      },
      {
        id: "listings",
        label: "Mijn Aanhangers",
        icon: <TrailerIcon />,
        mode: "lessor" as const,
      },
      {
        id: "lessor-reviews",
        label: "Reviews",
        icon: <Star className="h-4 w-4" />,
        mode: "lessor" as const,
      },
    ],
  };

  const currentNavItems = navigationItems[currentMode];

  return (
    <DrawerContent className="z-[102]">
      <DrawerHeader>
        <DrawerTitle>Profiel Menu</DrawerTitle>
      </DrawerHeader>
      <div className="px-4 pb-6">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profilePicture || undefined} />
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
        </div>

        {/* Mode Toggle */}
        {canAccessLessorMode && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-full">
              <button
                className={`flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-full transition-colors ${
                  currentMode === "renter"
                    ? "bg-white text-black shadow-sm font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleModeSwitch("renter")}
              >
                <Home className="h-3 w-3" />
                Huurder
              </button>
              <button
                className={`flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-full transition-colors ${
                  currentMode === "lessor"
                    ? "bg-white text-black shadow-sm font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleModeSwitch("lessor")}
              >
                <TrailerIcon className="h-3 w-3" />
                Verhuurder
              </button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="space-y-2">
          <div className="px-3 py-1 text-xs font-medium text-gray-500">
            {currentMode === "renter" ? "Menu" : "Voor verhuurders"}
          </div>
          {currentNavItems.map((item) => (
            <DrawerClose key={item.id} asChild>
              <button
                onClick={() => handleTabSwitch(item.id, item.mode)}
                className="flex items-center w-full px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <span className="mr-3">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            </DrawerClose>
          ))}
        </div>
      </div>
    </DrawerContent>
  );
};

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnreadCount } = useChat(); // Updated to use useChat
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { t } = useTranslation();

  // Scroll state management
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

  // Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      // Only trigger if scroll distance is above threshold
      if (scrollDifference < scrollThreshold) return;

      // Show when scrolling up or at top of page
      if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
        setIsVisible(true);
      }
      // Hide when scrolling down
      else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Don't show on detail pages that have their own bottom bars
  const isDetailPage = pathname.includes("/aanbod/");

  if (isDetailPage) {
    return null;
  }

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
    },
    {
      label: "Berichten",
      icon: MessageCircle,
      href: "/chat",
      isActive: pathname === "/chat",
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
    },
    {
      label: "Verhuren",
      icon: Plus,
      href: "/verhuren",
      isActive: pathname === "/verhuren" || pathname === "/plaatsen",
      isSpecial: true,
    },
    {
      label: "Profiel",
      icon: UserCircle,
      href: "/profiel",
      isActive: pathname === "/profiel",
      isProfileDrawerTrigger: user,
    },
  ];

  // Navigation items for non-authenticated users
  const guestNavItems = [
    {
      label: "Ontdekken",
      icon: Search,
      href: "/",
      isActive: pathname === "/",
    },
    {
      label: "Favorieten",
      icon: Heart,
      href: "/favorites",
      isActive: pathname === "/favorites",
    },
    {
      label: "Inloggen",
      icon: UserCircle,
      href: "#",
      isActive: false,
      onClick: () => setAuthDialogOpen(true),
    },
  ];

  const navItems = user ? authenticatedNavItems : guestNavItems;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div
        className={`
        fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-0.5 z-90 md:hidden
        transform transition-transform duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "translate-y-full"}
      `}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.isActive;

            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Icon size={18} strokeWidth={1.2} />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] min-w-[16px]">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium mt-1 leading-none">
                    {item.label}
                  </span>
                </button>
              );
            }

            if (item.isSpecial) {
              return (
                <Link key={index} href={item.href}>
                  <div
                    className={`flex flex-col items-center justify-center p-0 rounded-lg transition-all ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-dark rounded-full">
                      <Icon size={18} strokeWidth={1.2} />
                    </div>
                    <span className="text-[10px] font-medium mt-1 leading-none">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            }

            if (item.isProfileDrawerTrigger) {
              return (
                <Drawer key={index}>
                  <DrawerTrigger asChild>
                    <button
                      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                        isActive
                          ? "text-primary"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="size-5">
                          <AvatarImage
                            src={user?.profilePicture || undefined}
                          />
                          <AvatarFallback>
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-[10px] font-medium mt-1 leading-none">
                        {item.label}
                      </span>
                    </button>
                  </DrawerTrigger>
                  <ProfileSidebarDrawer user={user} />
                </Drawer>
              );
            }

            return (
              <Link key={index} href={item.href}>
                <div
                  className={`flex flex-col items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Icon size={18} strokeWidth={1.2} />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] min-w-[16px]">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium mt-1 leading-none">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the bottom nav */}
      <div className="h-6 md:hidden" />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialView="login"
      />
    </>
  );
};

export default MobileBottomNav;
