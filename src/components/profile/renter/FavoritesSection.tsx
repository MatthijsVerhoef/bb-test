"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Heart, Search, MapPin } from "lucide-react";
import NextImage from "next/image"; // Renamed to avoid conflict
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useInView } from "react-intersection-observer"; // This needs to be installed with: npm install react-intersection-observer
import { useFavoritesData } from "@/hooks/useFavoritesData";
import { useTranslation } from "@/lib/i18n/client";

export default function FavoritesSection() {
  const { favorites, removeFavorite } = useFavoritesData();
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { t } = useTranslation("profile");

  // Memoize the sorted favorites to prevent unnecessary re-renders
  const sortedFavorites = React.useMemo(() => {
    return [...favorites].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [favorites]);

  // Memoize the formatter to avoid recreating it on every render
  const formatCurrency = React.useMemo(() => {
    const formatter = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    });
    return (amount: number) => formatter.format(amount);
  }, []);

  // Use callback to avoid recreating functions on every render
  const handleRemove = React.useCallback(
    async (id: string) => {
      setRemovingId(id);
      try {
        // Using optimistic UI updates - will return immediately
        await removeFavorite(id);
      } catch (error) {
        console.error("Error removing favorite:", error);
      } finally {
        setRemovingId(null);
      }
    },
    [removeFavorite]
  );

  // Memoize navigation function
  const handleViewDetails = React.useCallback(
    (id: string) => {
      router.push(`/aanbod/${id}`);
    },
    [router]
  );

  // Memoize the favorite card component to prevent unnecessary re-renders
  const FavoriteCard = useCallback(
    ({
      favorite,
      index,
      isLast,
    }: {
      favorite: any;
      index: number;
      isLast: boolean;
    }) => {
      return (
        <Card key={favorite.id} className="p-0 border-0 shadow-none">
          <CardContent className="p-0">
            <div
              className={`flex flex-col ${
                !isLast ? "border-b pb-4" : ""
              } md:flex-row md:items-start relative`}
            >
              {/* Image section - optimize with next/image priority for visible items */}
              <div className="relative w-full md:w-42 h-30 mb-4 md:mb-0 md:mr-4 rounded-lg overflow-hidden">
                {favorite.mainImage ? (
                  <NextImage
                    src={favorite.mainImage}
                    alt={favorite.title}
                    fill
                    priority={index < 2} // Only prioritize first 2 images
                    loading={index < 2 ? "eager" : "lazy"}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content section */}
              <div className="flex-1">
                <h3 className="font-semibold">{favorite.title}</h3>

                {favorite.city && (
                  <span className="text-[13px] text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="sr-only">{t('favorites.location')}:</span>
                    {favorite.city}
                  </span>
                )}

                <div className="flex flex-wrap mt-6">
                  <span className="font-medium text-xs">{t('favorites.availability')}:</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{t('favorites.dailyAvailable')}</Badge>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap mt-2 pb-0">
                  <div className="flex items-center justify-end ms-auto gap-2">
                    <Button
                      className="text-xs"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(favorite.id)}
                      disabled={removingId === favorite.id}
                    >
                      {t('favorites.actions.remove')}
                    </Button>
                    <Button
                      className="text-xs"
                      variant="default"
                      size="sm"
                      onClick={() => handleViewDetails(favorite.id)}
                    >
                      {t('favorites.actions.view')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Price section */}
              <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end justify-between absolute h-fit top-0 end-0">
                <Badge variant="outline" className="bg-white">
                  <Heart
                    className="h-3.5 w-3.5 mr-1 text-primary fill-primary"
                    strokeWidth={1.5}
                  />
                  {t('favorites.badge')}
                </Badge>
                <div className="font-medium text-sm mt-2">
                  {formatCurrency(favorite.pricePerDay)}
                  <span className="text-xs text-muted-foreground">{t('favorites.perDay')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    [formatCurrency, handleRemove, handleViewDetails, removingId]
  );

  // Memoize the empty state component
  const EmptyState = useMemo(
    () => (
      <Card className="border-0 shadow-none bg-[#f6f8f9] min-h-[350px]">
        <CardContent className="flex flex-col items-center justify-center h-100 py-10">
          <Heart className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">{t('favorites.empty.title')}</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-1">
            {t('favorites.empty.description')}
          </p>
          <Link href="/aanbod">
            <Button className="mt-4">{t('favorites.empty.button')}</Button>
          </Link>
        </CardContent>
      </Card>
    ),
    [t]
  );

  // State for virtualized list
  const [visibleItems, setVisibleItems] = useState(5); // Initial number of items to show
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use intersection observer for infinite scroll virtualization
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  // Load more items when scrolling to bottom
  useEffect(() => {
    if (inView && hasScrolledOnce) {
      // Only load more if we've scrolled down at least once
      setVisibleItems((prev) => Math.min(prev + 5, sortedFavorites.length));
    }
  }, [inView, sortedFavorites.length, hasScrolledOnce]);

  // Track scroll events to determine if user has scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolledOnce) {
        setHasScrolledOnce(true);
      }
    };

    // Only add listener if needed
    if (!hasScrolledOnce && containerRef.current) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasScrolledOnce]);

  // Calculate visible slice of items
  const visibleFavorites = useMemo(() => {
    return sortedFavorites.slice(0, visibleItems);
  }, [sortedFavorites, visibleItems]);

  // Preload the next batch of images when we're close to showing them
  useEffect(() => {
    // Preload next 5 images beyond current visible set
    const preloadNextBatch = () => {
      const nextItems = sortedFavorites.slice(visibleItems, visibleItems + 5);
      nextItems.forEach((favorite) => {
        if (favorite.mainImage) {
          // Use the browser's Image constructor instead of Next.js Image
          const img = new window.Image();
          img.src = favorite.mainImage;
        }
      });
    };

    if (sortedFavorites.length > visibleItems) {
      // Only run in browser environment
      if (typeof window !== "undefined") {
        preloadNextBatch();
      }
    }
  }, [sortedFavorites, visibleItems]);

  // Main component render with virtualization
  return (
    <div className="space-y-6" ref={containerRef}>
      <div>
        <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
          {t('favorites.title')}
        </h2>
        <p className="text-muted-foreground mt-1">
          {t('favorites.description')}
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="space-y-4">
          {/* Render only the visible items */}
          {visibleFavorites.map((favorite, index) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              index={index}
              isLast={
                index === visibleFavorites.length - 1 &&
                visibleFavorites.length === sortedFavorites.length
              }
            />
          ))}

          {/* Add this invisible element to trigger loading more items */}
          {visibleItems < sortedFavorites.length && (
            <div
              ref={loadMoreRef}
              className="w-full h-20 flex items-center justify-center"
            >
              {inView && hasScrolledOnce && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              )}
            </div>
          )}

          {/* Show total count if we're not showing all items yet */}
          {visibleItems < sortedFavorites.length && (
            <div className="text-center text-sm text-muted-foreground">
              {t('favorites.showing', { visible: visibleItems, total: sortedFavorites.length })}
            </div>
          )}
        </div>
      ) : (
        EmptyState
      )}
    </div>
  );
}
