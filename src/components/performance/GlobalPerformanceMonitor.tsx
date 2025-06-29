// components/performance/GlobalPerformanceMonitor.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalPerformanceMonitor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const measurePerformance = async () => {
      // Wait for the page to be fully loaded
      if (document.readyState !== "complete") {
        window.addEventListener("load", measurePerformance);
        return;
      }

      // Get navigation timing
      const navTiming = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      if (navTiming) {
        const metrics = {
          // Network timings
          dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
          tcp: navTiming.connectEnd - navTiming.connectStart,
          ttfb: navTiming.responseStart - navTiming.requestStart,
          download: navTiming.responseEnd - navTiming.responseStart,

          // Processing timings
          domParsing: navTiming.domInteractive - navTiming.responseEnd,
          domContentLoaded:
            navTiming.domContentLoadedEventEnd -
            navTiming.domContentLoadedEventStart,
          domComplete: navTiming.domComplete - navTiming.domInteractive,
          loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,

          // Total time
          total: navTiming.loadEventEnd - navTiming.fetchStart,
        };

        console.log(`[PERF] Page Load Metrics for ${pathname}:`, {
          ...metrics,
          formatted: {
            network: `${(
              metrics.dns +
              metrics.tcp +
              metrics.ttfb +
              metrics.download
            ).toFixed(0)}ms`,
            processing: `${(
              metrics.domParsing +
              metrics.domContentLoaded +
              metrics.domComplete
            ).toFixed(0)}ms`,
            total: `${metrics.total.toFixed(0)}ms`,
          },
        });
      }

      // Measure Web Vitals
      if ("PerformanceObserver" in window) {
        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1];
          console.log(`[PERF] LCP: ${lcp.startTime.toFixed(0)}ms`);
        }).observe({ entryTypes: ["largest-contentful-paint"] });

        // FID
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            console.log(
              `[PERF] FID: ${(entry.processingStart - entry.startTime).toFixed(
                0
              )}ms`
            );
          });
        }).observe({ entryTypes: ["first-input"] });

        // CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ["layout-shift"] });

        // Log CLS after a delay
        setTimeout(() => {
          console.log(`[PERF] CLS: ${clsValue.toFixed(4)}`);
        }, 5000);
      }

      // Track specific page types
      if (pathname.startsWith("/aanbod/")) {
        trackTrailerPagePerformance();
      } else if (pathname === "/") {
        trackHomePagePerformance();
      }
    };

    measurePerformance();

    return () => {
      window.removeEventListener("load", measurePerformance);
    };
  }, [pathname, searchParams]);

  return null;
}

function trackTrailerPagePerformance() {
  // Measure image loading performance
  const images = performance
    .getEntriesByType("resource")
    .filter(
      (entry) =>
        entry.name.includes("_next/image") ||
        entry.name.match(/\.(jpg|jpeg|png|webp)/)
    );

  if (images.length > 0) {
    const totalImageTime = images.reduce((sum, img) => sum + img.duration, 0);
    console.log(
      `[PERF] Images: ${images.length} loaded in ${totalImageTime.toFixed(0)}ms`
    );
  }

  // Measure component render time
  performance.mark("trailer-page-interactive");
  const renderTime = performance.measure(
    "trailer-render",
    "navigationStart",
    "trailer-page-interactive"
  );
  console.log(
    `[PERF] Trailer page render: ${renderTime.duration.toFixed(0)}ms`
  );
}

function trackHomePagePerformance() {
  // Count trailer cards rendered
  const trailerCards = document.querySelectorAll(
    '[class*="TrailerCard"]'
  ).length;
  console.log(`[PERF] Home page: ${trailerCards} trailer cards rendered`);
}
