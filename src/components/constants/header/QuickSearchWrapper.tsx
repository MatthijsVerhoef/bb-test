"use client";

import { useState, useEffect } from "react";
import QuickSearch from "@/components/trailers/quick-search";
import { QuickSearchSkeleton } from "@/components/trailers/quick-search-skeleton";

interface QuickSearchWrapperProps {
  location: string;
  setLocation: (value: string) => void;
  dateRange: any;
  setDateRange: (value: any) => void;
  showMobileHeader: boolean;
}

export function QuickSearchWrapper(props: QuickSearchWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always show skeleton until client-side mount
  if (!isMounted) {
    return <QuickSearchSkeleton />;
  }

  return <QuickSearch {...props} />;
}
