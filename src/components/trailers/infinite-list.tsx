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
  const trailers = initialTrailers;
  const page = initialPage;
  const totalPages = initialTotalPages;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || newPage === page) return;

      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set("page", newPage.toString());

      const newUrl = `${pathname}?${currentParams.toString()}`;

      window.history.pushState({}, "", newUrl);
      router.push(newUrl, { scroll: false });
    },
    [page, totalPages, searchParams, router, pathname]
  );

  const paginationNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;

      pages.push(1);

      if (page > leftSide + 1) {
        pages.push(null);
      }

      const startMiddle = Math.max(2, page - leftSide);
      const endMiddle = Math.min(totalPages - 1, page + rightSide);

      for (let i = startMiddle; i <= endMiddle; i++) {
        pages.push(i);
      }

      if (page < totalPages - rightSide) {
        pages.push(null);
      }

      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [page, totalPages]);

  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center mt-8 mb-12">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center h-10 w-10 rounded-md mr-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

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

  const handleResetFilters = useCallback(() => {
    const newUrl = `${pathname}?page=1`;
    window.history.pushState({}, "", newUrl);
    router.push(newUrl, { scroll: false });
  }, [pathname, router]);

  return (
    <div>
      {trailers && trailers.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-y-6 gap-x-5">
            {trailers.map((trailer) => {
              const trailerWithProperAvailability = {
                ...trailer,
                available: trailer.available === false ? false : true,
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
            Geen aanhangers gevonden met huidige filters. Reset je filters of
            pas je zoekopdracht aan om resultaten te vinden.
          </p>
          <Button
            className="bg-primary rounded-full mt-6"
            onClick={handleResetFilters}
          >
            Reset filter
          </Button>
        </div>
      )}
    </div>
  );
}
