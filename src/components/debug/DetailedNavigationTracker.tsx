// components/debug/DetailedNavigationTracker.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __navStart?: number;
    __navLogs: Array<{ time: number; message: string }>;
    __logNavEvent: (message: string) => void;
  }
}

export function DetailedNavigationTracker() {
  const pathname = usePathname();
  const mountTime = useRef(performance.now());
  const hasLoggedMount = useRef(false);

  useEffect(() => {
    // ONLY RUN IN DEVELOPMENT
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Initialize navigation logging
    if (!window.__navLogs) {
      window.__navLogs = [];
    }

    window.__logNavEvent = (message: string) => {
      const time = performance.now();
      const relativeTime = window.__navStart ? time - window.__navStart : 0;
      window.__navLogs.push({ time, message });
      console.log(
        `%c[NAV +${relativeTime.toFixed(0)}ms] ${message}`,
        "background: #222; color: #bada55; padding: 2px 5px; border-radius: 3px;"
      );
    };

    // Log component mount
    if (!hasLoggedMount.current) {
      hasLoggedMount.current = true;
      const mountDuration = performance.now() - mountTime.current;
      window.__logNavEvent(
        `Component mounted: ${pathname} (mount took ${mountDuration.toFixed(
          0
        )}ms)`
      );
    }

    // Check if we're completing a navigation
    if (window.__navStart) {
      const navEnd = performance.now();
      const duration = navEnd - window.__navStart;

      // Log final navigation time
      console.log(
        `%c[NAV] Navigation to ${pathname} took ${duration.toFixed(0)}ms`,
        "background: #222; color: #ff6b6b; padding: 4px 8px; border-radius: 3px; font-weight: bold;"
      );

      // Reset for next navigation
      window.__navStart = undefined;
      window.__navLogs = [];
    }

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        trackPagePhases();
      });
    } else {
      setTimeout(() => {
        trackPagePhases();
      }, 1000);
    }
  }, [pathname]);

  return null;
}

function trackPagePhases() {
  if (process.env.NODE_ENV !== "development") return;

  // Track images loading
  const images = document.querySelectorAll("img");
  if (images.length > 0) {
    window.__logNavEvent?.(`${images.length} images found on page`);
  }

  // Monitor resource loading WITHOUT monkey-patching
  if ("PerformanceObserver" in window) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 100) {
            const name =
              resource.name.split("/").pop() || resource.name.substring(0, 50);
            window.__logNavEvent?.(
              `Slow resource loaded: ${name} (${resource.duration.toFixed(
                0
              )}ms)`
            );
          }
        }
      });

      resourceObserver.observe({ entryTypes: ["resource"] });

      // Disconnect after 5 seconds
      setTimeout(() => resourceObserver.disconnect(), 5000);
    } catch (e) {
      // Ignore errors
    }
  }
}

// Enhanced navigation start function
export function startDetailedNavigation(destination: string) {
  if (process.env.NODE_ENV !== "development") return;

  window.__navStart = performance.now();
  window.__navLogs = [];

  console.log(
    `%c[NAV] Navigation started to ${destination}`,
    "background: #222; color: #00ff00; padding: 4px 8px; border-radius: 3px; font-weight: bold;"
  );

  window.__logNavEvent("Click event triggered");
}
