"use client";

import Link from "next/link";
import { useAuth } from "@/stores/auth.store";
import { useChat } from "@/hooks/useChat";
import { useTranslation } from "@/lib/i18n/client";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound, MessageCircle } from "lucide-react";
import { LanguageDropdown } from "@/components/ui/language-dropdown";
import { menuItems } from "./menuItems";

interface MobileMenuContentProps {
  openAuthDialog: (view: "login" | "register") => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const MobileMenuContent = ({
  openAuthDialog,
  setIsOpen,
}: MobileMenuContentProps) => {
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* User Section */}
      {user && (
        <DropdownMenuLabel className="flex items-center px-3 py-3 border-b">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              className="object-cover"
              src={user?.profilePicture || undefined}
            />
            <AvatarFallback className="text-sm">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">
              {user.firstName
                ? `${user.firstName} ${user.lastName || ""}`
                : user.email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.firstName ? user.email : ""}
            </p>
          </div>
        </DropdownMenuLabel>
      )}

      {/* Navigation Items */}
      {user ? (
        <>
          {menuItems.authenticated.map((item) => (
            <DropdownMenuItem key={item.href} asChild className="px-3 py-2.5">
              <Link href={item.href} className="flex items-center">
                <item.icon size={16} className="mr-3 text-gray-500" />
                <span className="font-medium">{t(item.labelKey)}</span>
                {item.href === "/chat" && totalUnreadCount > 0 && (
                  <span className="ml-auto bg-primary text-white rounded-full px-1.5 text-xs py-0.5">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}

          {user.role === "LESSOR" && (
            <DropdownMenuItem asChild className="px-3 py-2.5">
              <Link href="/profiel?tab=listings" className="flex items-center">
                <svg
                  className="w-4 h-4 mr-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="font-medium">Mijn aanhangers</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </>
      ) : (
        <>
          <DropdownMenuItem
            className="px-3 py-2.5"
            onClick={() => openAuthDialog("login")}
          >
            <UserRound size={16} className="mr-3 text-gray-500" />
            <span className="font-medium">{t("header.login")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="px-3 py-2.5"
            onClick={() => openAuthDialog("register")}
          >
            <svg
              className="w-4 h-4 mr-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <span className="font-medium">Aanmelden</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}

      {/* General Navigation */}
      {menuItems.general.map((item) => (
        <DropdownMenuItem key={item.href} asChild className="px-3 py-2.5">
          <Link href={item.href} className="flex items-center">
            <svg
              className="w-4 h-4 mr-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={item.svgPath}
              />
            </svg>
            <span className="font-medium">{item.label}</span>
          </Link>
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator />

      {/* Language Selection */}
      <div className="px-3 py-2">
        <div className="flex items-center mb-2">
          <svg
            className="w-4 h-4 mr-3 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
          <span className="font-medium text-gray-700 text-sm">Taal</span>
          <div className="ml-auto">
            <LanguageDropdown />
          </div>
        </div>
      </div>

      {/* Logout Button */}
      {user && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="px-3 py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <svg
              className="w-4 h-4 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium">{t("header.logout")}</span>
          </DropdownMenuItem>
        </>
      )}
    </>
  );
};
