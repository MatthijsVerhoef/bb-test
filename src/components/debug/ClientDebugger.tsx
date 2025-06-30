// components/debug/ClientDebugger.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ClientDebugger() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<any>({});
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via query param or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const debugEnabled =
      urlParams.get("debug") === "true" ||
      localStorage.getItem("debug") === "true";

    if (debugEnabled) {
      setShow(true);
      localStorage.setItem("debug", "true");
    }

    // Collect metrics
    const collectMetrics = () => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];

      const jsFiles = resources.filter((r) => r.name.endsWith(".js"));
      const cssFiles = resources.filter((r) => r.name.endsWith(".css"));
      const images = resources.filter(
        (r) =>
          r.name.includes("_next/image") ||
          r.name.match(/\.(jpg|jpeg|png|webp|svg)/)
      );

      const largestJS = jsFiles.reduce(
        (max, file) => (file.transferSize > max.transferSize ? file : max),
        jsFiles[0] || { transferSize: 0 }
      );

      setMetrics({
        path: pathname,
        timing: nav
          ? {
              ttfb: Math.round(nav.responseStart - nav.fetchStart),
              domContentLoaded: Math.round(
                nav.domContentLoadedEventEnd - nav.fetchStart
              ),
              loadComplete: Math.round(nav.loadEventEnd - nav.fetchStart),
            }
          : {},
        resources: {
          js: {
            count: jsFiles.length,
            totalSize: Math.round(
              jsFiles.reduce((sum, f) => sum + f.transferSize, 0) / 1024
            ),
            totalTime: Math.round(
              jsFiles.reduce((sum, f) => sum + f.duration, 0)
            ),
            largest: largestJS
              ? {
                  name: largestJS.name.split("/").pop(),
                  size: Math.round(largestJS.transferSize / 1024),
                }
              : null,
          },
          css: {
            count: cssFiles.length,
            totalSize: Math.round(
              cssFiles.reduce((sum, f) => sum + f.transferSize, 0) / 1024
            ),
          },
          images: {
            count: images.length,
            totalTime: Math.round(
              images.reduce((sum, f) => sum + f.duration, 0)
            ),
          },
        },
      });
    };

    // Wait for page load
    if (document.readyState === "complete") {
      setTimeout(collectMetrics, 100);
    } else {
      window.addEventListener("load", () => setTimeout(collectMetrics, 100));
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        maxWidth: "300px",
        borderRadius: "5px",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      <div style={{ marginBottom: "5px", fontWeight: "bold" }}>
        🐛 Debug Mode
        <button
          onClick={() => {
            localStorage.removeItem("debug");
            setShow(false);
          }}
          style={{
            float: "right",
            background: "red",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          X
        </button>
      </div>

      <div>Path: {metrics.path}</div>

      {metrics.timing && (
        <>
          <div style={{ marginTop: "10px", fontWeight: "bold" }}>
            Page Load:
          </div>
          <div>TTFB: {metrics.timing.ttfb}ms</div>
          <div>DOM Ready: {metrics.timing.domContentLoaded}ms</div>
          <div>Full Load: {metrics.timing.loadComplete}ms</div>
        </>
      )}

      {metrics.resources && (
        <>
          <div style={{ marginTop: "10px", fontWeight: "bold" }}>
            Resources:
          </div>
          <div>
            JS: {metrics.resources.js.count} files,{" "}
            {metrics.resources.js.totalSize}KB
          </div>
          {metrics.resources.js.largest && (
            <div style={{ fontSize: "10px" }}>
              Largest: {metrics.resources.js.largest.name} (
              {metrics.resources.js.largest.size}KB)
            </div>
          )}
          <div>CSS: {metrics.resources.css.count} files</div>
          <div>
            Images: {metrics.resources.images.count} (
            {metrics.resources.images.totalTime}ms)
          </div>
        </>
      )}
    </div>
  );
}
