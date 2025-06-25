import Link from "next/link";
import { Menu } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserDropdownProps {
  user: any;
  totalUnreadCount: number;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  isMobile?: boolean;
}

export const UserDropdown = ({
  user,
  totalUnreadCount,
  onLogin,
  onRegister,
  onLogout,
  isMobile = false,
}: UserDropdownProps) => {
  const { t } = useTranslation();

  const LoggedInMenuItems = () => (
    <>
      <DropdownMenuLabel className="flex items-center px-3 py-3 border-b">
        <UserAvatar user={user} size="md" />
        <div className="flex-1 min-w-0 ml-3">
          <p className="font-medium text-gray-900 truncate text-sm">
            {user.firstName
              ? `${user.firstName} ${user.lastName || ""}`
              : user.email}
          </p>
          {user.firstName && (
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          )}
        </div>
      </DropdownMenuLabel>

      <DropdownMenuItem asChild className="px-3 py-2.5">
        <Link href="/profiel" className="flex items-center">
          <span className="font-medium">{t("header.profile")}</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild className="px-3 py-2.5">
        <Link href="/chat" className="flex items-center">
          <span className="font-medium">{t("header.chat")}</span>
          {totalUnreadCount > 0 && (
            <span className="ml-auto bg-primary text-white rounded-full px-1.5 text-xs py-0.5">
              {totalUnreadCount}
            </span>
          )}
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild className="px-3 py-2.5">
        <Link href="/profiel?tab=favorites">
          <span className="font-medium">Favorieten</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild className="px-3 py-2.5">
        <Link href="/profiel?tab=rentals">
          <span className="font-medium">Mijn huurovereenkomsten</span>
        </Link>
      </DropdownMenuItem>

      {user.role === "LESSOR" && (
        <DropdownMenuItem asChild className="px-3 py-2.5">
          <Link href="/profiel?tab=listings">
            <span className="font-medium">Mijn aanhangers</span>
          </Link>
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="px-3 py-2.5 text-red-600">
        <span className="font-medium">{t("header.logout")}</span>
      </DropdownMenuItem>
    </>
  );

  const GuestMenuItems = () => (
    <>
      <DropdownMenuItem className="px-3 py-2.5" onClick={onLogin}>
        <span className="font-medium">{t("header.login")}</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="px-3 py-2.5" onClick={onRegister}>
        <span className="font-medium">Aanmelden</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={
            isMobile
              ? "rounded-lg border-0 bg-gray-100 hover:border-gray-400"
              : "flex items-center border rounded-full hover:border-black hover:shadow-sm transition cursor-pointer p-1"
          }
        >
          {isMobile ? (
            <Menu size={18} />
          ) : (
            <>
              <Menu size={16} className="ms-2 me-2" />
              <UserAvatar user={user} />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 mt-1 rounded-xl border-none shadow-2xl"
      >
        {user ? <LoggedInMenuItems /> : <GuestMenuItems />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
