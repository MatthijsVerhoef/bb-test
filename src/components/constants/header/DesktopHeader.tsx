"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/stores/auth.store";
import { useChat } from "@/hooks/useChat";
import { useTranslation } from "@/lib/i18n/client";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import QuickSearch from "../../trailers/quick-search";
import { DesktopMenu } from "./DesktopMenu";
import { DesktopActions } from "./DesktopActions";
import { NavigationLinks } from "./NavigationLinks";
import { CondensedSearchButton } from "./CondensedSearchButton";

interface DesktopHeaderProps {
  scrolled: boolean;
  setScrolled: (scrolled: boolean) => void;
  location: string;
  setLocation: (location: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  openAuthDialog: (view: "login" | "register") => void;
  isDesktop: boolean;
}

export const DesktopHeader = ({
  scrolled,
  setScrolled,
  location,
  setLocation,
  dateRange,
  setDateRange,
  openAuthDialog,
  isDesktop,
}: DesktopHeaderProps) => {
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const { t } = useTranslation();
  const [openChatDrawer, setOpenChatDrawer] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <motion.div
      className={`fixed flex-col items-center py-2.5 px-4 md:px-8 start-0 w-full bg-white z-[80] hidden md:block ${
        scrolled ? "shadow-sm border-transparent" : "border-b"
      }`}
      animate={{ top: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex items-center w-full max-w-7xl mx-auto mb-3 md:mb-0">
        {/* Logo */}
        <Link href="/" className="z-20 flex relative items-center">
          <p className="font-bold text-lg">
            <span className="text-primary">Buur</span>
            <span className="text-green-700">Bak</span>
          </p>
        </Link>

        {/* Navigation Links */}
        <NavigationLinks scrolled={scrolled} />

        {/* Right side actions */}
        <div className="flex items-center ms-auto z-20 relative">
          <DesktopActions
            user={user}
            totalUnreadCount={totalUnreadCount}
            openChatDrawer={openChatDrawer}
            setOpenChatDrawer={setOpenChatDrawer}
          />

          <DesktopMenu
            user={user}
            totalUnreadCount={totalUnreadCount}
            openAuthDialog={openAuthDialog}
            handleLogout={handleLogout}
            setOpenChatDrawer={setOpenChatDrawer}
          />
        </div>
      </div>

      {/* QuickSearch section */}
      <motion.div
        className="w-full max-w-5xl mx-auto"
        initial={{ height: "auto", opacity: 1, marginTop: 16 }}
        animate={{
          height: scrolled ? "0" : "auto",
          opacity: scrolled ? 0 : 1,
          marginTop: scrolled ? 0 : isDesktop ? 15 : 0,
          marginBottom: scrolled ? 0 : isDesktop ? 12 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {!scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <QuickSearch
                location={location}
                setLocation={setLocation}
                dateRange={dateRange}
                setDateRange={setDateRange}
                showMobileHeader={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Condensed search button */}
      <AnimatePresence>
        {scrolled && (
          <CondensedSearchButton
            location={location}
            dateRange={dateRange}
            onClick={() => setScrolled(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
