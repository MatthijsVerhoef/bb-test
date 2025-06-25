"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Loader2 } from "lucide-react";
import LessorCalendar from "./LessorCalendar";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLessorCalendarData } from "@/hooks/useLessorCalendarData";
import { BlockAvailabilityDialog } from "./calendar/BlockAvailabilityDialog";
import { BlockedPeriodsList } from "./calendar/BlockedPeriodsList";

interface LessorCalendarPageProps {
  userId: string;
  externalTrailers?: any[]; // Optional prop for backward compatibility
  externalRentals?: any[]; // Optional prop for backward compatibility
  isLoading?: boolean;
}

export default function LessorCalendarPage({
  userId,
  externalTrailers,
  externalRentals,
  isLoading: externalLoading = false,
}: LessorCalendarPageProps) {
  // State to track rendering errors
  const [hasError, setHasError] = useState(false);
  
  // Use our new hook for data management - prefetch enabled by default
  const {
    data,
    isLoading: isDataLoading,
    addBlockedPeriod,
    removeBlockedPeriod,
    updateAvailability,
  } = useLessorCalendarData();

  // For compatibility with existing code, use either the data from the hook or the props
  // This allows for a gradual migration to the React Query pattern
  const trailers = externalTrailers || (data?.trailers || []);
  const rentals = externalRentals || (data?.rentals || []);
  const blockedPeriods = data?.blockedPeriods || [];
  const weeklyAvailability = data?.weeklyAvailability || {};
  
  const isLoading = externalLoading || isDataLoading;

  // Reset error state when data changes
  useEffect(() => {
    if (data) {
      setHasError(false);
    }
  }, [data]);

  if (isLoading) {
    return (
      <button className={`flex items-center px-3 py-2 rounded-md text-sm`}>
        <Calendar className="mr-3 h-4 w-4" /> Kalender
        <Loader2 className="size-4 ms-2 animate-spin text-primary" />
      </button>
    );
  }

  // Error fallback button
  if (hasError) {
    return (
      <button 
        className={`flex items-center px-3 py-2 rounded-md text-sm text-red-500`}
        onClick={() => setHasError(false)} // Allow retry
      >
        <Calendar className="mr-3 h-4 w-4" /> Kalender
      </button>
    );
  }

  // Wrap the calendar in an error boundary
  return (
    <Dialog>
      <DialogTrigger
        className={`flex items-center px-3 py-2 rounded-md text-sm`}
      >
        <Calendar className="mr-3 h-4 w-4" /> Kalender
      </DialogTrigger>
      <DialogContent className="min-w-[76vw] min-h-[80vh] rounded-2xl p-0">
        <div className="hidden">
          <DialogTitle>Calendar</DialogTitle>
        </div>
        
        {/* Error catching wrapper */}
        <ErrorBoundary onError={() => setHasError(true)}>
          <LessorCalendar
            userId={userId}
            trailers={trailers}
            rentals={rentals}
            blockedPeriods={blockedPeriods}
            weeklyAvailability={weeklyAvailability}
            onUpdateAvailability={updateAvailability}
            onAddBlockedPeriod={addBlockedPeriod}
            onRemoveBlockedPeriod={removeBlockedPeriod}
          />
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError?: () => void;
}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: any) {
    console.error("Calendar error:", error);
    this.props.onError?.();
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Kalender kan niet worden geladen</h3>
          <p className="text-gray-500 mb-4">
            Er is een probleem opgetreden bij het laden van de kalender.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Probeer opnieuw
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
