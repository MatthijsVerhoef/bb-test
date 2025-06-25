"use client";

import Link from "next/link";
import {
  User,
  CalendarDays,
  Star,
  Heart,
  Briefcase,
  Calendar,
  Settings,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface MobileOverviewProps {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    isVerified: boolean;
    role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
  };
  profileCompletion: number;
  onNavigate: (tab: string, mode?: "renter" | "lessor") => void;
}

export default function MobileOverview({
  user,
  profileCompletion,
  onNavigate,
}: MobileOverviewProps) {
  const canAccessLessorMode = user.role === "LESSOR" || user.role === "ADMIN";

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

  // Navigation items for renter
  const renterItems = [
    {
      id: "profile",
      label: "Mijn gegevens",
      icon: <UserRound className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "rentals",
      label: "Mijn Huurovereenkomsten",
      icon: <CalendarDays className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "favorites",
      label: "Favorieten",
      icon: <Heart className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "reviews",
      label: "Beoordelingen",
      icon: <Star className="size-5" strokeWidth={1.5} />,
    },
  ];

  // Navigation items for lessor
  const lessorItems = [
    {
      id: "lessor-dashboard",
      label: "Dashboard",
      icon: <Briefcase className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "lessor-rentals",
      label: "Boekingen",
      icon: <CalendarDays className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "lessor-calendar",
      label: "Kalender",
      icon: <Calendar className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "listings",
      label: "Mijn Aanhangers",
      icon: <TrailerIcon className="size-5" strokeWidth={1.5} />,
    },
    {
      id: "lessor-reviews",
      label: "Reviews",
      icon: <Star className="size-5" strokeWidth={1.5} />,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <h1 className="font-semibold text-2xl">Profiel</h1>
      {/* Profile Header */}
      <Card className="border-0 bg-[#F7F7F7]">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center">
            <Avatar className="h-16 w-16">
              {user.profilePicture ? (
                <AvatarImage
                  src={user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="text-lg font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 flex flex-col items-center justify-center mx-auto mt-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center mt-2 space-x-2">
                <Badge variant="outline" className="text-xs">
                  Profiel {profileCompletion}% compleet
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-1">
        <h2 className="text-[13px] font-medium text-gray-500 px-1">Algemeen</h2>
        <div className="space-y-2 mt-2 px-1 border-b pb-4">
          {renterItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left"
              onClick={() => {
                // Call parent handler to update state
                onNavigate(item.id, "renter");
              }}
            >
              <Card className="border-0 p-0 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100">
                <CardContent className="py-3 px-3 rounded-0">
                  <div className="flex items-center space-x-4">
                    <div className="">{item.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-900">{item.label}</h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Lessor Section - Only show if user has access */}
      {canAccessLessorMode && (
        <div className="space-y-1">
          <h2 className="text-[13px] font-medium text-gray-500 px-1">
            Verhuurder opties
          </h2>
          <div className="space-y-2 mt-2 px-1 border-b pb-4">
            {lessorItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left"
                onClick={() => {
                  // Call parent handler to update state
                  onNavigate(item.id, "lessor");
                }}
              >
                <Card className="border-0 p-0 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100">
                  <CardContent className="py-3 px-3 rounded-0">
                    <div className="flex items-center space-x-4">
                      <div className="">{item.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-sm text-gray-900">{item.label}</h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-1">
        <h2 className="text-[13px] font-medium text-gray-500 px-1">
          Instellingen
        </h2>
        <button
          type="button"
          className="w-full text-left"
          onClick={() => {
            // Open settings dialog
            const event = new CustomEvent("openSettingsDialog");
            window.dispatchEvent(event);
          }}
        >
          <Card className="border-0 p-0 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100">
            <CardContent className="px-3 py-3">
              <div className="flex items-center space-x-4">
                <div>
                  <Settings className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm text-gray-900">Accountinstellingen</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}
