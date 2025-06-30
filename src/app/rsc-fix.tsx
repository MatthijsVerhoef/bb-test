"use client";

import { useEffect } from "react";

export function RSCFix() {
  useEffect(() => {
    // Temporary patch for the includes error
    const originalIncludes = String.prototype.includes;
    const originalStartsWith = String.prototype.startsWith;

    // Override with safe versions
    String.prototype.includes = function (searchString, position) {
      try {
        if (this == null) return false;
        return originalIncludes.call(String(this), searchString, position);
      } catch (e) {
        console.error("includes error:", e);
        return false;
      }
    };

    String.prototype.startsWith = function (searchString, position) {
      try {
        if (this == null) return false;
        return originalStartsWith.call(String(this), searchString, position);
      } catch (e) {
        console.error("startsWith error:", e);
        return false;
      }
    };

    // Cleanup
    return () => {
      String.prototype.includes = originalIncludes;
      String.prototype.startsWith = originalStartsWith;
    };
  }, []);

  return null;
}
