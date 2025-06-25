import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const useHeaderScroll = (isMobile: boolean) => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(pathname !== "/");
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
        const isScrolled = currentScrollY > 50;
        if (pathname === "/" && isScrolled !== scrolled) {
          setScrolled(isScrolled);
        } else if (pathname !== "/" && !scrolled && currentScrollY > 50) {
          setScrolled(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled, pathname, isMobile, lastScrollY]);

  useEffect(() => {
    setScrolled(isMobile ? false : pathname !== "/");
  }, [pathname, isMobile]);

  return { scrolled, setScrolled, showMobileHeader };
};