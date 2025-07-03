"use client";

import { Menu, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

interface DesktopMenuProps {
  user: any;
  totalUnreadCount: number;
  openAuthDialog: (view: "login" | "register") => void;
  handleLogout: () => void;
  setOpenChatDrawer: (open: boolean) => void;
}

export const DesktopMenu = ({
  user,
  totalUnreadCount,
  openAuthDialog,
  handleLogout,
  setOpenChatDrawer,
}: DesktopMenuProps) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center border rounded-full hover:border-black hover:shadow-sm transition cursor-pointer p-1">
          <Menu size={16} className="ms-2 me-2" />
          <Avatar>
            <AvatarImage
              className="object-cover"
              src={user?.profilePicture || undefined}
            />
            <AvatarFallback className="text-xs">
              {user ? (
                <>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </>
              ) : (
                <UserRound size={16} />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 mt-1 rounded-xl border-none shadow-2xl"
      >
        {user ? (
          <>
            <DropdownMenuLabel className="flex truncate max-w-[90%] items-center px-3 py-2.5">
              <Avatar className="mr-2">
                <AvatarImage src={user?.profilePicture || undefined} />
                <AvatarFallback className="text-xs">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              {user.firstName
                ? `${user.firstName} ${user.lastName || ""}`
                : user.email}
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="px-3 py-2.5">
              <Link href="/profiel">
                <span>{t("header.profile")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2.5 cursor-pointer"
              onClick={() => setOpenChatDrawer(true)}
            >
              <span>{t("header.chat")}</span>
              {totalUnreadCount > 0 && (
                <span className="ml-auto bg-primary text-white rounded-full px-1.5 text-xs py-0.5">
                  {totalUnreadCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-3 py-2.5">
              <Link href="/profiel?tab=favorites&mode=renter">
                <span>Favorieten</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-3 py-2.5">
              <Link href="/profiel?tab=rentals">
                <span>Mijn huurovereenkomsten</span>
              </Link>
            </DropdownMenuItem>
            {user.role === "LESSOR" && (
              <DropdownMenuItem asChild className="px-3 py-2.5">
                <Link href="/profiel?tab=listings">
                  <span>Mijn aanhangers</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="px-3 py-2.5">
              <span>{t("header.logout")}</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              className="px-3 py-2"
              onClick={() => openAuthDialog("login")}
            >
              <span>{t("header.login")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2"
              onClick={() => openAuthDialog("register")}
            >
              <span>Aanmelden</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="px-3 py-2">
              <Link href="/verhuren">
                <span>Ik wil verhuren</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-3 py-2">
              <Link href="/how-it-works">
                <span>Hoe het werkt</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-3 py-2">
              <Link href="/faq">
                <span>Veelgestelde vragen</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-3 py-2">
              <Link href="/help">
                <span>Help</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
