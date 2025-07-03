"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/stores/auth.store";
import { useChat } from "@/hooks/useChat";
import AuthDialog from "@/components/constants/auth/auth-dialog";
import { useTranslation } from "@/lib/i18n/client";

// Constants
const SCROLL_THRESHOLD = 10;
const PROFILE_URL = "/profiel?tab=overview&mode=renter";

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnreadCount } = useChat();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { t } = useTranslation();

  // Scroll state management
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Optimized scroll handler with RAF
  const updateNavVisibility = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

    // Only trigger if scroll distance is above threshold
    if (scrollDifference < SCROLL_THRESHOLD) {
      ticking.current = false;
      return;
    }

    // Show when scrolling up or at top of page
    if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
      setIsVisible(true);
    }
    // Hide when scrolling down
    else if (currentScrollY > lastScrollY.current) {
      setIsVisible(false);
    }

    lastScrollY.current = currentScrollY;
    ticking.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(updateNavVisibility);
      ticking.current = true;
    }
  }, [updateNavVisibility]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Don't show on detail pages that have their own bottom bars
  const isDetailPage = pathname?.includes("/aanbod/") || false;

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
      href: PROFILE_URL,
      isActive: pathname === "/profiel",
      isProfile: true,
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
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-700"
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
                        ? "text-primary"
                        : "text-gray-500 hover:text-gray-700"
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

            // Profile item with avatar for authenticated users
            if (item.isProfile && user) {
              return (
                <Link key={index} href={item.href}>
                  <div
                    className={`flex flex-col items-center justify-center rounded-lg transition-all ${
                      isActive
                        ? "text-primary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="size-8">
                        <AvatarImage src={user?.profilePicture || undefined} />
                        <AvatarFallback className="text-xs">
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-[10px] font-medium mt-1 leading-none">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            }

            return (
              <Link key={index} href={item.href}>
                <div
                  className={`flex flex-col items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-700"
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
