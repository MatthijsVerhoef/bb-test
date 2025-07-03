"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import QuickSearch from "../../trailers/quick-search";
import { DateRange } from "react-day-picker";

interface MobileHeaderProps {
  isHomePage: boolean;
  showMobileHeader: boolean;
  scrolled: boolean;
  location: string;
  setLocation: (location: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  openAuthDialog: (view: "login" | "register") => void;
}

export const MobileHeader = ({
  isHomePage,
  showMobileHeader,
  scrolled,
  location,
  setLocation,
  dateRange,
  setDateRange,
  openAuthDialog,
}: MobileHeaderProps) => {
  return (
    <>
      {/* Mobile Menu Button - Non-home pages */}
      {!isHomePage && (
        <motion.div
          className="md:hidden fixed top-0 right-4 py-2 z-[100]"
          initial={{ y: 0 }}
          animate={{ y: showMobileHeader ? 0 : -44 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <MobileMenu openAuthDialog={openAuthDialog} />
        </motion.div>
      )}

      {/* Mobile Home Page Header */}
      {isHomePage && (
        <motion.div
          className="fixed flex-col items-center py-2.5 px-4 start-0 w-full bg-white z-[80] md:hidden"
          animate={{ top: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-center w-full max-w-7xl mx-auto mb-3">
            <Link href="/" className="z-20 flex relative items-center">
              <p className="font-bold text-lg">
                <span className="text-primary">Buur</span>
                <span className="text-green-700">Bak</span>
              </p>
            </Link>

            {/* Mobile Menu Button - positioned over QuickSearch */}
            <div className="absolute top-2.5 right-4 z-[101]">
              <MobileMenu openAuthDialog={openAuthDialog} />
            </div>
          </div>

          {/* QuickSearch for mobile */}
          {!scrolled && (
            <motion.div className="w-full max-w-5xl mx-auto">
              <QuickSearch
                location={location}
                setLocation={setLocation}
                dateRange={dateRange}
                setDateRange={setDateRange}
                showMobileHeader={showMobileHeader}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </>
  );
};
