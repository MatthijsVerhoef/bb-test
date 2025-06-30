// hooks/useProductionPerformance.ts
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

let navigationStartTime: number | null = null;

export function useProductionPerformance() {
  const pathname = usePathname();

  useEffect(() => {
    const reportPerformance = async () => {
      // Calculate navigation time if we have a start time
      let navigationDuration = null;
      if (navigationStartTime) {
        navigationDuration = performance.now() - navigationStartTime;
        navigationStartTime = null;
      }

      // Collect performance metrics
      const metrics: any = {
        path: pathname,
        timestamp: new Date().toISOString(),
        navigationDuration,
        userAgent: navigator.userAgent,
      };

      // Get navigation timing
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        metrics.pageLoad = {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          ttfb: navEntry.responseStart - navEntry.requestStart,
          total: navEntry.loadEventEnd - navEntry.fetchStart,
        };
      }

      // Get resource timing
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const imageResources = resources.filter(r => 
        r.name.includes('_next/image') || 
        r.name.match(/\.(jpg|jpeg|png|webp)/)
      );

      metrics.resources = {
        javascript: {
          count: jsResources.length,
          totalSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          totalTime: jsResources.reduce((sum, r) => sum + r.duration, 0),
        },
        images: {
          count: imageResources.length,
          totalTime: imageResources.reduce((sum, r) => sum + r.duration, 0),
        },
      };

      // Get Web Vitals if available
      if ('PerformanceObserver' in window) {
        try {
          // LCP
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries.length > 0) {
            metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
          }

          // Get paint timings
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            metrics.fcp = fcp.startTime;
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Send to API endpoint
      try {
        await fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics),
        });
      } catch (error) {
        // Fail silently
      }

      // Also send to any analytics service you're using
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'performance_metrics', {
          event_category: 'Performance',
          event_label: pathname,
          value: Math.round(navigationDuration || 0),
          custom_map: metrics
        });
      }
    };

    // Report after a short delay to ensure all metrics are available
    const timer = setTimeout(reportPerformance, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);
}

// Export function to mark navigation start
export function markNavigationStart() {
  navigationStartTime = performance.now();
}

// Add this to your TrailerCard onClick
export function trackClick(destination: string) {
  markNavigationStart();
  
  // Also track in analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'navigation_start', {
      event_category: 'Navigation',
      event_label: destination,
    });
  }
}