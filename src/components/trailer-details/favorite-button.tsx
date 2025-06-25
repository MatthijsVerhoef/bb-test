"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoritesData } from "@/hooks/useFavoritesData";

interface FavoriteButtonProps {
  trailerId: string;
  trailerData: any; // Type this according to your Trailer model
}

export default function FavoriteButton({
  trailerId,
  trailerData,
}: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesData();
  const [isFavorited, setIsFavorited] = useState(false);

  // Check initial favorite state from context on component mount
  useEffect(() => {
    setIsFavorited(isFavorite(trailerId));
  }, [trailerId, isFavorite]);

  // Handle favorite toggle
  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigation

    setIsLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(trailerId);
        setIsFavorited(false);
      } else {
        await addFavorite(trailerData);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={`shadow-none rounded-full ${
        isFavorited ? "text-primary" : ""
      }`}
      onClick={handleFavorite}
      disabled={isLoading}
    >
      <Heart
        className={isFavorited ? "fill-primary text-primary" : ""}
        strokeWidth={isFavorited ? 0 : 1.5}
      />
    </Button>
  );
}
