import { Search } from "lucide-react";

export function QuickSearchSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden lg:flex justify-center items-center px-4 sm:px-0">
        <div className="relative bg-white rounded-full shadow-md border border-gray-200 flex items-center h-16 px-2 w-auto max-w-4xl">
          {/* Location */}
          <div className="h-full min-w-[250px] flex flex-col px-6 py-2">
            <span className="text-xs font-semibold mb-1">Locatie</span>
            <div className="h-5 bg-gray-100 rounded w-32 animate-pulse" />
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 my-auto" />

          {/* Arrival date */}
          <div className="h-full flex flex-col min-w-[230px] px-6 py-2">
            <span className="text-xs font-semibold">Ophalen</span>
            <div className="h-5 bg-gray-100 rounded w-24 animate-pulse mt-0.5" />
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 my-auto" />

          {/* Departure date */}
          <div className="h-full flex flex-col min-w-[230px] px-6 py-2">
            <span className="text-xs font-semibold">Terugbrengen</span>
            <div className="h-5 bg-gray-100 rounded w-24 animate-pulse mt-0.5" />
          </div>

          {/* Search button */}
          <div className="w-12 ml-4 rounded-full bg-primary/80 h-12 flex items-center justify-center">
            <Search className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="lg:hidden px-0 my-0">
        <div className="w-full bg-white rounded-full shadow-sm border border-gray-200 p-2 ps-4 flex items-center justify-between">
          <div className="flex items-center w-full justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-100 rounded w-40 animate-pulse" />
            </div>
            <div className="bg-primary/80 text-white rounded-full p-2">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
