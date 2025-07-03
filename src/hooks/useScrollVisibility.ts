import { useState, useEffect, useRef } from "react";

export const useScrollVisibility = (pathname: string, view: string | null) => {
  const [scrolled, setScrolled] = useState(pathname !== "/");
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showMobileHeader, setShowMobileHeader] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      setIsMobile(width < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (view === "map") {
      setScrolled(true);
    }
  }, [view]);

  useEffect(() => {
    if (isMobile) {
      setScrolled(false);
    } else {
      setScrolled(pathname !== "/");
    }
  }, [pathname, isMobile]);

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
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled, pathname, isMobile, lastScrollY]);

  return { scrolled, showMobileHeader, isMobile, isDesktop };
};