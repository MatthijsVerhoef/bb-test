"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface RatingCategory {
  id: string;
  name: string;
  label: string;
  description: string;
}

interface RentalData {
  id: string;
  trailerId: string;
  trailerTitle: string;
  trailerImage: string | null;
  lessorId: string;
}

interface TrailerReviewDialogProps {
  rental: RentalData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitReview: (reviewData: ReviewData) => Promise<void>;
}

interface ReviewData {
  rentalId: string;
  trailerId: string;
  lessorId: string;
  rating: number;
  title: string;
  comment: string;
  cleanliness: number;
  maintenance: number;
  valueForMoney: number;
  accuracy: number;
  recommended: boolean;
}

const RATING_CATEGORIES: RatingCategory[] = [
  {
    id: "cleanliness",
    name: "cleanliness",
    label: "Netheid",
    description: "Was de aanhanger schoon en verzorgd?",
  },
  {
    id: "maintenance",
    name: "maintenance",
    label: "Onderhoud",
    description: "Was de aanhanger goed onderhouden?",
  },
  {
    id: "valueForMoney",
    name: "valueForMoney",
    label: "Goede deal",
    description: "Was de prijs-kwaliteitverhouding goed?",
  },
  {
    id: "accuracy",
    name: "accuracy",
    label: "Komt overeen",
    description: "Kwam de aanhanger overeen met de beschrijving?",
  },
];

export default function TrailerReviewDialog({
  rental,
  open,
  onOpenChange,
  onSubmitReview,
}: TrailerReviewDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState<{
    rating: number;
    title: string;
    comment: string;
    cleanliness: number;
    maintenance: number;
    valueForMoney: number;
    accuracy: number;
    recommended: boolean;
  }>({
    rating: 0,
    title: "",
    comment: "",
    cleanliness: 0,
    maintenance: 0,
    valueForMoney: 0,
    accuracy: 0,
    recommended: true,
  });

  const isFormValid = () => {
    return (
      formState.rating > 0 &&
      formState.comment.trim().length > 0 &&
      formState.cleanliness > 0 &&
      formState.maintenance > 0 &&
      formState.valueForMoney > 0 &&
      formState.accuracy > 0
    );
  };

  const handleRatingChange = (category: string, rating: number) => {
    setFormState((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecommendedChange = (checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      recommended: checked,
    }));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast("Vul alle verplichte velden in", {
        description:
          "Zorg ervoor dat je een beoordeling geeft voor alle categorieën",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: ReviewData = {
        rentalId: rental.id,
        trailerId: rental.trailerId,
        lessorId: rental.lessorId,
        ...formState,
      };

      await onSubmitReview(reviewData);

      toast("Beoordeling geplaatst", {
        description:
          "Bedankt voor je feedback! Je beoordeling is succesvol ingediend.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast("Fout bij het indienen", {
        description:
          "Er is een probleem opgetreden bij het plaatsen van je beoordeling. Probeer het later opnieuw.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    category: string,
    currentRating: number,
    size: "sm" | "lg" = "sm"
  ) => {
    const starSize = size === "lg" ? "h-6 w-6" : "h-4 w-4";

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`${category}-${star}`}
            type="button"
            className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
            onClick={() => handleRatingChange(category, star)}
          >
            <Star
              className={`${starSize} transition-colors ${
                star <= currentRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300 hover:text-gray-400"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 bg-white border-0 shadow-2xl">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Beoordeel je huurervaring
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm -mt-3">
                Deel je ervaring en help anderen bij het maken van een keuze
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Trailer Card */}
            <div className="flex items-center p-4 bg-gray-50 rounded-xl mb-6">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                {rental.trailerImage ? (
                  <Image
                    src={rental.trailerImage}
                    alt={rental.trailerTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Geen foto</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {rental.trailerTitle}
                </h3>
              </div>
            </div>

            <div className="space-y-6">
              {/* Overall Rating */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-3 block">
                  Algemene beoordeling
                </Label>
                <div className="flex items-center gap-3">
                  {renderStars("rating", formState.rating, "lg")}
                  {formState.rating > 0 && (
                    <span className="text-gray-600 text-sm">
                      {formState.rating} van 5 sterren
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-900 mb-2 block"
                >
                  Titel van je review
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Geef je review een titel..."
                  value={formState.title}
                  onChange={handleInputChange}
                  className="h-10 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Comment */}
              <div>
                <Label
                  htmlFor="comment"
                  className="text-sm font-medium text-gray-900 mb-2 block"
                >
                  Beschrijf je ervaring
                </Label>
                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="Vertel over je ervaring met deze aanhanger..."
                  value={formState.comment}
                  onChange={handleInputChange}
                  className="min-h-[100px] text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              {/* Rating Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Beoordeel specifieke aspecten
                </h3>

                <div className="space-y-4">
                  {RATING_CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1 mr-4">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {category.label}
                        </h4>
                        <p className="text-gray-600 text-xs">
                          {category.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {renderStars(
                          category.id,
                          formState[
                            category.id as keyof typeof formState
                          ] as number
                        )}
                        {formState[category.id as keyof typeof formState] >
                          0 && (
                          <span className="text-xs text-gray-500">
                            {formState[category.id as keyof typeof formState]}/5
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="recommended"
                  checked={formState.recommended}
                  onCheckedChange={handleRecommendedChange}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="recommended"
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  Ik zou deze aanhanger aanbevelen aan anderen
                </Label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-transparent">
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="px-4 py-2 h-auto text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Annuleren
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className="px-6 py-2 h-auto text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Versturen...
                  </>
                ) : (
                  "Plaats beoordeling"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
