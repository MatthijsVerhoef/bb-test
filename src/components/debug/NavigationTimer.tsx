// components/debug/NavigationTimer.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __navStart?: number;
  }
}

export function NavigationTimer() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're finishing a navigation
    if (window.__navStart) {
      const navEnd = performance.now();
      const duration = navEnd - window.__navStart;

      // This will show in browser console
      console.log(
        `%c[NAV] Navigation to ${pathname} took ${duration.toFixed(0)}ms`,
        "background: #222; color: #bada55; padding: 2px 5px; border-radius: 3px;"
      );

      // Reset
      window.__navStart = undefined;
    }
  }, [pathname]);

  return null;
}

// Export function to start timing
export function startNavigationTimer() {
  window.__navStart = performance.now();
  console.log(
    "%c[NAV] Navigation started",
    "background: #222; color: #ff6b6b; padding: 2px 5px; border-radius: 3px;"
  );
}
