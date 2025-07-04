import {
  User,
  CalendarDays,
  Star,
  Heart,
  Home,
  Briefcase,
  Calendar,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "../ui/button";
import { SettingsButton } from "./settings/settings-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SidebarProfileImageUpload from "./SidebarProfileImageUpload";
import { useTranslation } from "@/lib/i18n/client";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    isVerified: boolean;
    memberSince: Date;
    role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
  };
  profileCompletion: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeMode: "renter" | "lessor";
  setActiveMode: (mode: "renter" | "lessor") => void;
  editProfileInfo?: boolean;
  isLoadingFullData?: boolean;
  unreadNotifications?: number;
}

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

export default function Sidebar({
  user,
  profileCompletion,
  activeTab,
  setActiveTab,
  activeMode,
  setActiveMode,
  editProfileInfo = false,
}: SidebarProps) {
  const { t } = useTranslation("profile");

  // Navigation items for each mode
  const navigationItems = {
    renter: [
      {
        id: "profile",
        label: t("sidebar.tabs.renter.profile"),
        icon: <User className="h-4 w-4" />,
      },
      {
        id: "rentals",
        label: t("sidebar.tabs.renter.rentals"),
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        id: "favorites",
        label: t("sidebar.tabs.renter.favorites"),
        icon: <Heart className="h-4 w-4" />,
      },
      {
        id: "reviews",
        label: t("sidebar.tabs.renter.reviews"),
        icon: <Star className="h-4 w-4" />,
      },
    ],
    lessor: [
      {
        id: "lessor-dashboard",
        label: t("sidebar.tabs.lessor.dashboard"),
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        id: "lessor-rentals",
        label: t("sidebar.tabs.lessor.rentals"),
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        id: "lessor-calendar",
        label: t("sidebar.tabs.lessor.calendar"),
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        id: "listings",
        label: t("sidebar.tabs.lessor.listings"),
        icon: <TrailerIcon />,
      },
      {
        id: "lessor-reviews",
        label: t("sidebar.tabs.lessor.reviews"),
        icon: <Star className="h-4 w-4" />,
      },
    ],
  };

  const canAccessLessorMode = user.role === "LESSOR" || user.role === "ADMIN";
  const currentNavItems = navigationItems[activeMode];

  // Format member since date
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "N/A";

      return new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(dateObj);
    } catch {
      return "N/A";
    }
  };

  return (
    <Card className="sticky top-20 shadow-none rounded-2xl py-10 pb-14">
      <SettingsButton className="absolute top-0 right-0 rounded-full mt-2 me-2 border-0 shadow-none size-12" />

      <CardHeader className="relative pb-0">
        <div className="flex flex-col items-center">
          <SidebarProfileImageUpload user={user} />

          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              {t("sidebar.memberSince")} {formatDate(user.memberSince)}
            </p>
          </div>

          {canAccessLessorMode && (
            <div className="w-full mt-6 px-3">
              <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-full">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 text-[13px] py-2 px-3 rounded-full transition-colors ${
                    activeMode === "renter"
                      ? "bg-white text-black shadow-sm font-medium"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveMode("renter")}
                >
                  <Home className="h-3.5 w-3.5" />
                  {t("sidebar.mode.renter")}
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 text-[13px] py-2 px-3 rounded-full transition-colors ${
                    activeMode === "lessor"
                      ? "bg-white text-black shadow-sm font-medium"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveMode("lessor")}
                >
                  <TrailerIcon />
                  {t("sidebar.mode.lessor")}
                </button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="-mt-3">
        <nav className="flex flex-col space-y-2.5">
          <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
            {activeMode === "renter"
              ? t("sidebar.menu")
              : t("sidebar.forLessors")}
          </div>

          {currentNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${
                activeTab === item.id
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/50"
              }`}
              aria-current={activeTab === item.id ? "page" : undefined}
            >
              <span className="mr-2.5">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
