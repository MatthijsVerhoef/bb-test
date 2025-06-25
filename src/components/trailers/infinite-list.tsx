"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TrailerCard from "@/components/trailers/trailer-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

interface PaginationListProps {
  initialTrailers: any[];
  initialPage: number;
  limit: number;
  totalPages: number;
}

export function TrailersPaginationList({
  initialTrailers,
  initialPage,
  limit,
  totalPages: initialTotalPages,
}: PaginationListProps) {
  // Use server data directly for display
  const trailers = initialTrailers;
  const page = initialPage;
  const totalPages = initialTotalPages;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();


  // Navigate to a specific page
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || newPage === page) return;
      
      // Create URL params
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set("page", newPage.toString());
      
      // Navigate to new page - this will trigger server component to re-render
      router.push(`${pathname}?${currentParams.toString()}`);
    },
    [page, totalPages, searchParams, router, pathname]
  );

  // Generate pagination numbers
  const paginationNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all page numbers if total pages are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show strategic page numbers for larger pagination
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;

      // Always show first page
      pages.push(1);

      if (page > leftSide + 1) {
        pages.push(null); // Represents ellipsis
      }

      // Calculate the start and end for middle pages
      const startMiddle = Math.max(2, page - leftSide);
      const endMiddle = Math.min(totalPages - 1, page + rightSide);

      for (let i = startMiddle; i <= endMiddle; i++) {
        pages.push(i);
      }

      if (page < totalPages - rightSide) {
        pages.push(null); // Represents ellipsis
      }

      // Always show last page if it's not already included
      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [page, totalPages]);

  // Render pagination
  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center mt-8 mb-12">
        {/* Previous page button */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center h-10 w-10 rounded-md mr-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Page numbers */}
        <div className="flex space-x-2">
          {paginationNumbers.map((pageNum, index) =>
            pageNum === null ? (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center h-10 px-4"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${pageNum}`}
                onClick={() => handlePageChange(pageNum as number)}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                  pageNum === page
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Next page button */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center h-10 w-10 rounded-md ml-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }, [page, totalPages, paginationNumbers, handlePageChange]);

  return (
    <div>
      {trailers && trailers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-6 gap-x-5">
            {trailers.map((trailer) => {
              // Ensure trailer.available is a proper boolean
              const trailerWithProperAvailability = {
                ...trailer,
                // If available is undefined/null, default to true
                available: trailer.available === false ? false : true
              };
              
              return (
                <div key={trailer.id} className="transition-all duration-300">
                  <TrailerCard trailer={trailerWithProperAvailability} />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && renderPagination()}
        </>
      ) : (
        <div className="bg-gray-50 text-center p-12 rounded-md">
          <p className="text-gray-500">
            Geen aanhangers gevonden met huidige filters. Reset je filters
            of pas je zoekopdracht aan om resultaten te vinden.
          </p>
          <Button 
            className="bg-primary rounded-full mt-6"
            onClick={() => {
              // Reset filters via URL to trigger reload
              router.push(`${pathname}?page=1`);
            }}
          >
            Reset filter
          </Button>
        </div>
      )}
    </div>
  );
}
