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

      // Show navigation timeline
      if (window.__navLogs.length > 0) {
        console.group(
          "%c[NAV] Navigation Timeline",
          "color: #00ff00; font-weight: bold;"
        );
        window.__navLogs.forEach((log, index) => {
          const timeSinceStart = log.time - window.__navStart!;
          const timeSincePrev =
            index > 0 ? log.time - window.__navLogs[index - 1].time : 0;
          console.log(
            `%c+${timeSinceStart.toFixed(0)}ms (Δ${timeSincePrev.toFixed(
              0
            )}ms)%c ${log.message}`,
            "color: #888; font-size: 11px;",
            "color: #fff;"
          );
        });
        console.groupEnd();
      }

      // Analyze performance phases
      analyzePerformance(duration);

      // Reset for next navigation
      window.__navStart = undefined;
      window.__navLogs = [];
    }

    // Track various page loading phases
    const trackPagePhases = () => {
      // Track DOMContentLoaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          window.__logNavEvent("DOM Content Loaded");
        });
      }

      // Track images loading
      const images = document.querySelectorAll("img");
      if (images.length > 0) {
        window.__logNavEvent(`${images.length} images found on page`);

        let loadedImages = 0;
        images.forEach((img) => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.addEventListener("load", () => {
              loadedImages++;
              if (loadedImages === images.length) {
                window.__logNavEvent("All images loaded");
              }
            });
          }
        });

        if (loadedImages === images.length) {
          window.__logNavEvent("All images already loaded (from cache)");
        }
      }

      // Track React hydration (approximate)
      const checkHydration = setInterval(() => {
        const reactRoot =
          document.querySelector("[data-reactroot]") ||
          document.querySelector("#__next");
        if (reactRoot && reactRoot.children.length > 0) {
          window.__logNavEvent("React hydration likely complete");
          clearInterval(checkHydration);
        }
      }, 50);

      // Clean up after 5 seconds
      setTimeout(() => clearInterval(checkHydration), 5000);
    };

    trackPagePhases();

    // Monitor resource loading
    if ("PerformanceObserver" in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 100) {
            // Only log slow resources
            const name =
              resource.name.split("/").pop() || resource.name.substring(0, 50);
            window.__logNavEvent(
              `Slow resource loaded: ${name} (${resource.duration.toFixed(
                0
              )}ms)`
            );
          }
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ["resource"] });

        // Disconnect after navigation is complete
        setTimeout(() => resourceObserver.disconnect(), 5000);
      } catch (e) {
        // Ignore errors
      }
    }

    // Track API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === "string" ? args[0] : args[0].url;
      const apiPath = url.includes("/api/") ? url.split("/api/")[1] : url;
      const startTime = performance.now();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        if (duration > 50) {
          // Only log slower API calls
          window.__logNavEvent(
            `API call: ${apiPath} (${duration.toFixed(0)}ms)`
          );
        }
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        window.__logNavEvent(
          `API call failed: ${apiPath} (${duration.toFixed(0)}ms)`
        );
        throw error;
      }
    };

    // Restore original fetch on cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname]);

  return null;
}

function analyzePerformance(totalDuration: number) {
  console.group(
    "%c[NAV] Performance Analysis",
    "color: #ffff00; font-weight: bold;"
  );

  if (totalDuration < 1000) {
    console.log("✅ Navigation was fast (< 1s)");
  } else if (totalDuration < 2000) {
    console.log("⚠️ Navigation was moderate (1-2s)");
  } else {
    console.log("❌ Navigation was slow (> 2s)");
  }

  // Get navigation timing if available
  const navEntry = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming;
  if (navEntry) {
    console.log(
      "Server response time:",
      (navEntry.responseEnd - navEntry.fetchStart).toFixed(0) + "ms"
    );
    console.log(
      "DOM processing:",
      (navEntry.domContentLoadedEventEnd - navEntry.responseEnd).toFixed(0) +
        "ms"
    );
    console.log(
      "Page load complete:",
      (navEntry.loadEventEnd - navEntry.domContentLoadedEventEnd).toFixed(0) +
        "ms"
    );
  }

  // Check for large resources
  const resources = performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[];
  const largeResources = resources
    .filter((r) => r.transferSize > 100 * 1024) // > 100KB
    .sort((a, b) => b.transferSize - a.transferSize)
    .slice(0, 3);

  if (largeResources.length > 0) {
    console.log("Large resources detected:");
    largeResources.forEach((r) => {
      const name = r.name.split("/").pop() || r.name;
      console.log(`  - ${name}: ${(r.transferSize / 1024).toFixed(0)}KB`);
    });
  }

  console.groupEnd();
}

// Enhanced navigation start function with more logging
export function startDetailedNavigation(destination: string) {
  window.__navStart = performance.now();
  window.__navLogs = [];

  console.log(
    `%c[NAV] Navigation started to ${destination}`,
    "background: #222; color: #00ff00; padding: 4px 8px; border-radius: 3px; font-weight: bold;"
  );

  window.__logNavEvent("Click event triggered");

  // Log current page state
  const currentImages = document.querySelectorAll("img").length;
  const currentScripts = document.querySelectorAll("script").length;
  window.__logNavEvent(
    `Leaving page with ${currentImages} images, ${currentScripts} scripts`
  );

  // Track when Next.js actually starts navigation
  let routeChangeDetected = false;
  const checkRouteChange = setInterval(() => {
    // Check if URL has changed
    if (window.location.pathname === destination) {
      if (!routeChangeDetected) {
        routeChangeDetected = true;
        window.__logNavEvent("URL changed - Next.js navigation started");
        clearInterval(checkRouteChange);
      }
    }
  }, 10);

  // Clean up after 10 seconds
  setTimeout(() => clearInterval(checkRouteChange), 10000);
}
