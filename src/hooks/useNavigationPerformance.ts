// hooks/useNavigationPerformance.ts
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Global variable to track navigation start
if (typeof window !== 'undefined') {
  (window as any).__navigationStart = null;
}

export function useNavigationPerformance() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're completing a navigation
    if (typeof window !== 'undefined' && (window as any).__navigationStart) {
      const navigationEnd = performance.now();
      const navigationDuration = navigationEnd - (window as any).__navigationStart;
      
      console.log(`[CLIENT PERF] Navigation to ${pathname} took ${navigationDuration.toFixed(0)}ms`);
      
      // Reset for next navigation
      (window as any).__navigationStart = null;
      
      // Log additional metrics after navigation
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const recentResources = resources.filter(r => 
          r.startTime > navigationEnd - navigationDuration
        );
        
        const jsFiles = recentResources.filter(r => r.name.includes('.js'));
        const cssFiles = recentResources.filter(r => r.name.includes('.css'));
        const images = recentResources.filter(r => 
          r.name.includes('_next/image') || 
          r.name.match(/\.(jpg|jpeg|png|webp)/)
        );
        
        console.log('[CLIENT PERF] Resources loaded during navigation:', {
          javascript: {
            count: jsFiles.length,
            totalTime: jsFiles.reduce((sum, r) => sum + r.duration, 0).toFixed(0) + 'ms',
            totalSize: (jsFiles.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024).toFixed(0) + 'KB'
          },
          css: {
            count: cssFiles.length,
            totalTime: cssFiles.reduce((sum, r) => sum + r.duration, 0).toFixed(0) + 'ms'
          },
          images: {
            count: images.length,
            totalTime: images.reduce((sum, r) => sum + r.duration, 0).toFixed(0) + 'ms'
          }
        });
        
        // Find slowest resources
        const slowest = recentResources
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 3);
          
        if (slowest.length > 0) {
          console.log('[CLIENT PERF] Slowest resources:');
          slowest.forEach(r => {
            const name = r.name.split('/').pop() || r.name;
            console.log(`  - ${name}: ${r.duration.toFixed(0)}ms`);
          });
        }
      }, 100);
    }
  }, [pathname]);
}

// Export function to track navigation start
export function trackNavigationStart() {
  if (typeof window !== 'undefined') {
    (window as any).__navigationStart = performance.now();
    console.log('[CLIENT PERF] Navigation started');
  }
}