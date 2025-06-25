"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReviewSkeletonProps {
  count?: number;
  type?: "card" | "compact";
  includeResponse?: boolean;
}

export default function ReviewSkeleton({
  count = 3,
  type = "card",
  includeResponse = false,
}: ReviewSkeletonProps) {
  const renderReviewSkeleton = (index: number) => (
    <Card 
      key={index} 
      className={type === "card" ? "p-0 border-0 shadow-none" : "p-0 border-0 shadow-none bg-transparent"}
    >
      <CardContent className="p-0">
        <div className={`flex flex-col ${index < count - 1 ? "border-b pb-6" : ""} space-y-4`}>
          {/* Reviewer and trailer info */}
          <div className="flex justify-between animate-in fade-in slide-in-from-top-4 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start">
              <div className="relative h-12 w-12 rounded-full overflow-hidden mr-3">
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Rating */}
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 text-gray-200"
                />
              ))}
            </div>
          </div>

          {/* Review content */}
          <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${(index * 100) + 100}ms` }}>
            <Skeleton className="h-5 w-3/4" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>

          {/* Owner response - only shown if includeResponse is true */}
          {includeResponse && (
            <div className="bg-gray-100 p-4 rounded-lg space-y-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${(index * 100) + 200}ms` }}>
              <Skeleton className="h-4 w-40" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${(index * 100) + 300}ms` }}>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in duration-300">
        <Skeleton className="w-48 h-8 mb-1" />
        <Skeleton className="w-72 h-5" />
      </div>

      <div className="space-y-2 pt-4 animate-in fade-in duration-300" style={{ animationDelay: '100ms' }}>
        <div className="flex space-x-3 mb-6">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        
        <div className="space-y-6 pt-2">
          {Array.from({ length: count }).map((_, i) => renderReviewSkeleton(i))}
        </div>
      </div>
    </div>
  );
}