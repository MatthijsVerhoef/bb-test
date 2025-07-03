"use client";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Heart, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useFavoritesData } from "@/hooks/useFavoritesData";
import { useTranslation } from "@/lib/i18n/client";
import { startNavigationTimer } from "../debug/NavigationTimer";
import { startDetailedNavigation } from "@/components/debug/DetailedNavigationTracker";

interface TrailerCardProps {
  trailer: {
    id: string;
    title: string;
    city?: string;
    pricePerDay: number;
    available: boolean;
    mainImage: string;
  };
}

export default function TrailerCard({ trailer }: TrailerCardProps) {
  const { t } = useTranslation("home");
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesData();
  const [imageError, setImageError] = useState(false);
  const [isFavoriteState, setIsFavoriteState] = useState(() =>
    isFavorite(trailer.id)
  );

  // Memoize favorite status to prevent unnecessary re-renders
  if (isFavoriteState !== isFavorite(trailer.id)) {
    setIsFavoriteState(isFavorite(trailer.id));
  }

  const handleClick = useCallback(() => {
    startDetailedNavigation(`/aanbod/${trailer.id}`);
  }, [trailer.id]);

  // Handle favorite toggle with optimistic UI updates
  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setIsFavoriteState(!isFavoriteState);

    if (isFavoriteState) {
      removeFavorite(trailer.id).catch((error) => {
        console.error("Error removing favorite:", error);
        setIsFavoriteState(true);
      });
    } else {
      addFavorite(trailer).catch((error) => {
        console.error("Error adding favorite:", error);
        setIsFavoriteState(false);
      });
    }
  }

  // Check if image URL is valid/safe to load
  const isValidImageUrl =
    trailer.mainImage &&
    !trailer.mainImage.includes("ornate-bookcase.com") &&
    !imageError;

  return (
    <Card className="relative overflow-hidden py-0 border-none shadow-none bg-white flex flex-col rounded-md">
      {/* Image */}
      <Link
        href={`/aanbod/${trailer.id}`}
        className="relative block overflow-hidden aspect-[6/5] md:aspect-[6/4] rounded-lg md:rounded-md"
        onClick={handleClick}
      >
        {isValidImageUrl ? (
          <Image
            src={trailer.mainImage}
            alt={trailer.title}
            fill
            className="object-cover bg-gray-200 transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">
                <Camera />
              </div>
            </div>
          </div>
        )}

        {trailer.available === false && (
          <Badge
            variant="destructive"
            className="absolute bg-primary top-3 left-3 font-medium"
          >
            {t("trailerCard.unavailable")}
          </Badge>
        )}

        <button
          className={cn(
            "absolute top-2 right-2 cursor-pointer p-2 rounded-full transition-colors",
            "bg-black/50 hover:bg-black/70"
          )}
          title={
            isFavoriteState
              ? t("trailerCard.removeFromFavorites")
              : t("trailerCard.addToFavorites")
          }
          onClick={handleFavorite}
        >
          <Heart
            className={cn(
              "w-5 h-5",
              isFavoriteState ? "text-primary fill-primary" : "text-white"
            )}
            strokeWidth={1.5}
          />
        </button>
      </Link>

      <CardContent className="-mt-[10px] p-0">
        <Link href={`/aanbod/${trailer.id}`} onClick={handleClick}>
          <h3 className="text-[15px] font-semibold text-gray-900 transition-colors line-clamp-1">
            {trailer.title}
          </h3>
        </Link>

        {trailer.city && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
            <span>{trailer.city}</span>
          </div>
        )}

        <div className="mt-2">
          <span className="text-sm font-semibold text-gray-900">
            €{trailer.pricePerDay.toFixed(2).toString().replace(".", ",")}
          </span>
          <span className="text-xs text-gray-500">
            {t("trailerCard.perDay")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
