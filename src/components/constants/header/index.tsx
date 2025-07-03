"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import AuthDialog from "@/components/constants/auth/auth-dialog";
import { DateRange } from "react-day-picker";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import { MobileHeader } from "./header/MobileHeader";
import { DesktopHeader } from "./header/DesktopHeader";

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState<"login" | "register">(
    "login"
  );
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const isHomePage = pathname === "/";
  const view = searchParams.get("view");

  // Use custom hook for scroll behavior
  const { scrolled, showMobileHeader, isMobile, isDesktop } =
    useScrollVisibility(pathname, view);

  const openAuthDialog = (view: "login" | "register") => {
    setAuthDialogView(view);
    setAuthDialogOpen(true);
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          isHomePage={isHomePage}
          showMobileHeader={showMobileHeader}
          scrolled={scrolled}
          location={location}
          setLocation={setLocation}
          dateRange={dateRange}
          setDateRange={setDateRange}
          openAuthDialog={openAuthDialog}
        />
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <DesktopHeader
          scrolled={scrolled}
          // setScrolled={setScrolled}
          location={location}
          setLocation={setLocation}
          dateRange={dateRange}
          setDateRange={setDateRange}
          openAuthDialog={openAuthDialog}
          isDesktop={isDesktop}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialView={authDialogView}
      />
    </>
  );
}
