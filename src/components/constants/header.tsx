"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QuickSearch from "../trailers/quick-search";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, UserRound, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import AuthDialog from "@/components/constants/auth/auth-dialog";
import { useAuth } from "@/stores/auth.store";
import { usePathname, useSearchParams } from "next/navigation";
import ChatDrawer from "@/components/chat/chat-drawer";
import NotificationsDropdown from "@/components/constants/notifications-dropdown";
import { DateRange } from "react-day-picker";
import { LanguageDropdown } from "@/components/ui/language-dropdown";
import { useTranslation } from "@/lib/i18n/client";
import { useChat } from "@/hooks/useChat";

const Header = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(pathname !== "/");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState<"login" | "register">(
    "login"
  );
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showMobileHeader, setShowMobileHeader] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (isMobile) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setShowMobileHeader(false);
        } else if (currentScrollY < lastScrollY) {
          setShowMobileHeader(true);
        }
        setLastScrollY(currentScrollY);
      } else {
        if (pathname === "/") {
          const isScrolled = currentScrollY > 50;
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
        } else {
          if (!scrolled && currentScrollY > 50) {
            setScrolled(true);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled, pathname, isMobile, lastScrollY]);

  useEffect(() => {
    if (isMobile) {
      setScrolled(false);
    } else {
      setScrolled(pathname !== "/");
    }
  }, [pathname, isMobile]);

  // Check for screen size (lg breakpoint = 1024px, mobile = 768px)
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      setIsMobile(width < 768);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const openAuthDialog = (view: "login" | "register") => {
    setAuthDialogView(view);
    setAuthDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatArrivalDate = () => {
    if (!dateRange?.from) return "Datums toevoegen";
    return format(dateRange.from, "d MMM", { locale: nl });
  };

  // Format departure date display
  const formatDepartureDate = () => {
    if (!dateRange?.to) return "Datums toevoegen";
    return format(dateRange.to, "d MMM", { locale: nl });
  };

  const isHomePage = pathname === "/";

  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  useEffect(() => {
    if (view === "map") {
      setScrolled(true);
    }
  }, [view]);

  return (
    <div>
      {/* Mobile Header Bar - Only show menu button on non-home pages */}
      {!isHomePage && isMobile && (
        <motion.div
          className="md:hidden fixed top-0 right-4 py-2 z-[100]"
          initial={{ y: 0 }}
          animate={{ y: showMobileHeader ? 0 : -44 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Mobile Menu Dropdown */}
          <DropdownMenu
            open={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-0 bg-gray-100 hover:border-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M10 6h10" />
                  <path d="M4 12h16" />
                  <path d="M7 12h13" />
                  <path d="M4 18h10" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 mt-1 max-h-[80vh] overflow-y-auto rounded-xl border-none shadow-2xl z-[101]"
            >
              {/* User Section */}
              {user && (
                <>
                  <DropdownMenuLabel className="flex items-center px-3 py-3 border-b">
                    <Avatar className="h-10 w-10 mr-3">
                      {user?.profilePicture ? (
                        <AvatarImage
                          className="object-cover"
                          src={user.profilePicture}
                          alt={user.firstName || "User"}
                        />
                      ) : (
                        <AvatarFallback className="text-sm">
                          {user ? (
                            (
                              <>
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </>
                            ) || user.email.charAt(0).toUpperCase()
                          ) : (
                            <UserRound size={16} />
                          )}
                        </AvatarFallback>
                      )}
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
                </>
              )}

              {/* Navigation Items */}
              {user ? (
                // Logged in menu items
                <>
                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link href="/profiel" className="flex items-center">
                      <UserRound size={16} className="mr-3 text-gray-500" />
                      <span className="font-medium">{t("header.profile")}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link href="/chat" className="flex items-center">
                      <MessageCircle size={16} className="mr-3 text-gray-500" />
                      <span className="font-medium">{t("header.chat")}</span>
                      {totalUnreadCount > 0 && (
                        <span className="ml-auto bg-primary text-white rounded-full px-1.5 text-xs py-0.5">
                          {totalUnreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link
                      href="/profiel?tab=favorites"
                      className="flex items-center"
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
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span className="font-medium">Favorieten</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link
                      href="/profiel?tab=rentals"
                      className="flex items-center"
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        Mijn huurovereenkomsten
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  {user.role === "LESSOR" && (
                    <DropdownMenuItem asChild className="px-3 py-2.5">
                      <Link
                        href="/profiel?tab=listings"
                        className="flex items-center"
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
                // Not logged in - auth buttons
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

              {/* General Navigation Links */}
              <DropdownMenuItem asChild className="px-3 py-2.5">
                <Link href="/verhuren" className="flex items-center">
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="font-medium">{t("header.addTrailer")}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="px-3 py-2.5">
                <Link href="/contact" className="flex items-center">
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
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Hoe het werkt</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="px-3 py-2.5">
                <Link href="/blogs" className="flex items-center">
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
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span className="font-medium">Blogs</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="px-3 py-2.5">
                <Link href="/contact" className="flex items-center">
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
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">Contact</span>
                </Link>
              </DropdownMenuItem>

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
                  <span className="font-medium text-gray-700 text-sm">
                    Taal
                  </span>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      )}

      {/* Desktop + Mobile QuickSearch Section - Fixed positioning */}
      <motion.div
        className={`fixed flex-col items-center py-2.5 px-4 md:px-8 start-0 w-full bg-white z-[80] ${
          scrolled ? "shadow-sm border-transparent" : "border-b"
        }`}
        animate={{
          top: isMobile ? (showMobileHeader ? 0 : 0) : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          display: isMobile && !isHomePage ? "none" : "block",
        }}
      >
        <div className="flex items-center w-full max-w-7xl mx-auto mb-3 md:mb-0">
          {/* Desktop + Mobile Home Logo */}
          <Link href="/" className="z-20 flex relative items-center">
            <p className="font-bold text-lg">
              <span className="text-primary">Buur</span>
              <span className="text-green-700">Bak</span>
            </p>
          </Link>

          {/* Navigation links - hidden on mobile, visible on desktop */}
          {!scrolled && (
            <div
              className={`hidden md:flex items-center gap-x-6 md:gap-x-14 absolute left-1/2 -translate-x-1/2 text-[15px] font-medium transition-all duration-300 ${
                scrolled ? "top-1/2 -translate-y-1/2 z-10" : "top-[18px] z-20"
              }`}
            >
              <Link
                href="/verhuren"
                className="hover:text-primary transition-colors"
              >
                {t("header.addTrailer")}
              </Link>
              <Link
                href="/contact"
                className="hover:text-primary transition-colors"
              >
                Hoe het werkt
              </Link>
              <Link
                href="/blogs"
                className="hover:text-primary transition-colors"
              >
                Blogs
              </Link>
              <Link
                href="/contact"
                className="hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </div>
          )}

          {/* Right side avatar dropdown - Desktop only */}
          <div className="flex items-center ms-auto z-20 relative">
            {/* Language Dropdown - Desktop only */}
            <div className="me-1 hidden md:block">
              <LanguageDropdown />
            </div>

            {user && (
              <>
                {/* Chat Drawer - Desktop only */}
                <div className="hidden md:block">
                  <ChatDrawer
                    trigger={
                      <Button
                        variant={"outline"}
                        size={"icon"}
                        className="rounded-full shadow-none me-3 relative"
                      >
                        <MessageCircle strokeWidth={1.5} />
                        {totalUnreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px]">
                            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                          </span>
                        )}
                      </Button>
                    }
                  />
                </div>

                {/* Notifications Dropdown - Desktop only */}
                <div className="hidden md:block">
                  <NotificationsDropdown />
                </div>
              </>
            )}

            {/* Desktop dropdown menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center border rounded-full hover:border-black hover:shadow-sm transition cursor-pointer p-1">
                    <Menu size={16} className="ms-2 me-2" />
                    <Avatar>
                      {user?.profilePicture ? (
                        <AvatarImage
                          className="object-cover"
                          src={user.profilePicture}
                          alt={user.firstName || "User"}
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {user ? (
                            (
                              <>
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </>
                            ) || user.email.charAt(0).toUpperCase()
                          ) : (
                            <UserRound size={16} />
                          )}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-1 rounded-xl border-none shadow-2xl"
                >
                  {user ? (
                    // Logged in user menu items
                    <>
                      <DropdownMenuLabel className="flex truncate max-w-[90%] items-center px-3 py-2.5">
                        <Avatar className="mr-2">
                          {user?.profilePicture ? (
                            <AvatarImage
                              src={user.profilePicture}
                              alt={user.firstName || "User"}
                            />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {user ? (
                                (
                                  <>
                                    {user.firstName?.[0]}
                                    {user.lastName?.[0]}
                                  </>
                                ) || user.email.charAt(0).toUpperCase()
                              ) : (
                                <UserRound size={16} />
                              )}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {user.firstName
                          ? `${user.firstName} ${user.lastName || ""}`
                          : user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <Link href="/profiel" className="flex items-center">
                          <span>{t("header.profile")}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <span
                          className="flex items-center"
                          onClick={() => openChatDrawer(true)}
                        >
                          <span>{t("header.chat")}</span>
                          {totalUnreadCount > 0 && (
                            <span className="ml-auto bg-primary text-white rounded-full px-1.5 text-xs py-0.5">
                              {totalUnreadCount}
                            </span>
                          )}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <Link
                          href="/profiel?tab=favorites&mode=renter"
                          className="flex items-center"
                        >
                          <span>Favorieten</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <Link
                          href="/profiel?tab=rentals"
                          className="flex items-center"
                        >
                          <span>Mijn huurovereenkomsten</span>
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "LESSOR" && (
                        <DropdownMenuItem asChild className="px-3 py-2.5">
                          <Link
                            href="/profiel?tab=listings"
                            className="flex items-center"
                          >
                            <span>Mijn aanhangers</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="px-3 py-2.5"
                      >
                        <span>{t("header.logout")}</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    // Not logged in menu items
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
                        <Link href="/verhuren" className="flex items-center">
                          <span>Ik wil verhuren</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-3 py-2">
                        <Link
                          href="/how-it-works"
                          className="flex items-center"
                        >
                          <span>Hoe het werkt</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-3 py-2">
                        <Link href="/faq" className="flex items-center">
                          <span>Veelgestelde vragen</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-3 py-2">
                        <Link href="/help" className="flex items-center">
                          <span>Help</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button for Home Page - positioned over QuickSearch */}
        {isHomePage && isMobile && (
          <div className="absolute top-2.5 right-4 z-[101]">
            <DropdownMenu
              open={isMobileMenuOpen}
              onOpenChange={setIsMobileMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-0 bg-gray-100 hover:border-gray-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M10 6h10" />
                    <path d="M4 12h16" />
                    <path d="M7 12h13" />
                    <path d="M4 18h10" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 mt-1 max-h-[80vh] overflow-visible rounded-xl border-none shadow-2xl z-[102]"
              >
                {/* User Section */}
                {user && (
                  <>
                    <DropdownMenuLabel className="flex items-center px-3 py-3 border-b">
                      <Avatar className="h-10 w-10 mr-3">
                        {user?.profilePicture ? (
                          <AvatarImage
                            className="object-cover"
                            src={user.profilePicture}
                            alt={user.firstName || "User"}
                          />
                        ) : (
                          <AvatarFallback className="text-sm">
                            {user ? (
                              (
                                <>
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </>
                              ) || user.email.charAt(0).toUpperCase()
                            ) : (
                              <UserRound size={16} />
                            )}
                          </AvatarFallback>
                        )}
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
                  </>
                )}

                {/* Navigation Items */}
                {user ? (
                  // Logged in menu items
                  <>
                    <DropdownMenuItem asChild className="px-3 py-2.5">
                      <Link href="/profiel" className="flex items-center">
                        <UserRound size={16} className="mr-3 text-gray-500" />
                        <span className="font-medium">
                          {t("header.profile")}
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="px-3 py-2.5">
                      <Link href="/chat" className="flex items-center">
                        <MessageCircle
                          size={16}
                          className="mr-3 text-gray-500"
                        />
                        <span className="font-medium">{t("header.chat")}</span>
                        {totalUnreadCount > 0 && (
                          <span className="ml-auto bg-primary text-white rounded-full px-1.5 text-xs py-0.5">
                            {totalUnreadCount}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="px-3 py-2.5">
                      <Link
                        href="/profiel?tab=favorites"
                        className="flex items-center"
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
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="font-medium">Favorieten</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="px-3 py-2.5">
                      <Link
                        href="/profiel?tab=rentals"
                        className="flex items-center"
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="font-medium">
                          Mijn huurovereenkomsten
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    {user.role === "LESSOR" && (
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <Link
                          href="/profiel?tab=listings"
                          className="flex items-center"
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
                  // Not logged in - auth buttons
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

                {/* General Navigation Links */}
                <DropdownMenuItem asChild className="px-3 py-2.5">
                  <Link href="/verhuren" className="flex items-center">
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="font-medium">
                      {t("header.addTrailer")}
                    </span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="px-3 py-2.5">
                  <Link href="/contact" className="flex items-center">
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
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">Hoe het werkt</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="px-3 py-2.5">
                  <Link href="/blogs" className="flex items-center">
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
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                    <span className="font-medium">Blogs</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="px-3 py-2.5">
                  <Link href="/contact" className="flex items-center">
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
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Contact</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Language Selection */}
                <div className="px-3 py-2 overflow-visible">
                  <div className="flex items-center mb-2 overflow-visible">
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
                    <span className="font-medium text-gray-700 text-sm">
                      Taal
                    </span>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* QuickSearch section with animation */}
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
                  showMobileHeader={showMobileHeader}
                />
                {/* <QuickSearchWrapper
                  location={location}
                  setLocation={setLocation}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showMobileHeader={showMobileHeader}
                /> */}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Condensed search button that appears when scrolled - positioned over the nav links */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30"
            >
              <button
                onClick={() => setScrolled(false)}
                className="flex items-center space-x-2 bg-white ps-5 pe-1 py-1 min-w-[400px] rounded-full cursor-pointer border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {!location || Object.keys(dateRange).length <= 0 ? (
                  <span className="text-sm font-medium">
                    Zoek een aanhanger
                  </span>
                ) : (
                  <span className="text-sm font-medium">
                    {location} <span className="mx-2">|</span>{" "}
                    {formatArrivalDate()} - {formatDepartureDate()}
                  </span>
                )}
                <div className="ms-auto bg-primary p-1.5 rounded-full text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-search ms-auto"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Dialog */}
        <AuthDialog
          isOpen={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          initialView={authDialogView}
        />
      </motion.div>
    </div>
  );
};

export default Header;
