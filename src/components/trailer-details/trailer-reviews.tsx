"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StarIcon,
  ChevronDown,
  Sparkles,
  Wrench,
  DollarSign,
  MessageCircle,
  CheckCircle2,
  ThumbsUp,
  Users,
  CalendarDays,
  Star,
  PenOff,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n/client";

interface ReviewerInfo {
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  responseDate: Date | null;
  cleanliness?: number | null;
  maintenance?: number | null;
  valueForMoney?: number | null;
  communication?: number | null;
  accuracy?: number | null;
  recommended?: boolean | null;
  createdAt: Date;
  reviewer: ReviewerInfo;
}

interface TrailerReviewsProps {
  reviews: Review[];
  avgRating: number | null;
}

export default function TrailerReviews({
  reviews,
  avgRating,
}: TrailerReviewsProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { t } = useTranslation("trailer");

  // Indien er geen reviews zijn, toon dan een bericht
  if (!reviews || reviews.length === 0) {
    return (
      <Card className="p-0 border-0 rounded-none shadow-none">
        <h4 className="font-semibold text-lg text-[#222222]">
          {t("reviews.title")}
        </h4>
        <CardContent className="text-sm flex flex-col items-center justify-center -mt-4 bg-[#f6f8f9] p-8 text-center rounded-xl">
          <PenOff className="size-6 min-w-6 min-h-6" strokeWidth={1.5} />
          <p className="text-gray-500 mt-2">
            {t("reviews.noReviews")} {t("reviews.beFirstReview")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate category ratings
  const categoryRatings = {
    cleanliness: {
      sum: reviews.reduce((sum, review) => sum + (review.cleanliness || 0), 0),
      count: reviews.filter((review) => review.cleanliness).length,
      icon: <Sparkles size={18} strokeWidth={1.5} className="text-[#222222]" />,
      label: t("reviews.categories.cleanliness"),
    },
    maintenance: {
      sum: reviews.reduce((sum, review) => sum + (review.maintenance || 0), 0),
      count: reviews.filter((review) => review.maintenance).length,
      icon: <Wrench size={18} strokeWidth={1.5} className="text-[#222222]" />,
      label: t("reviews.categories.maintenance"),
    },
    valueForMoney: {
      sum: reviews.reduce(
        (sum, review) => sum + (review.valueForMoney || 0),
        0
      ),
      count: reviews.filter((review) => review.valueForMoney).length,
      icon: (
        <DollarSign size={18} strokeWidth={1.5} className="text-[#222222]" />
      ),
      label: t("reviews.categories.valueForMoney"),
    },
    communication: {
      sum: reviews.reduce(
        (sum, review) => sum + (review.communication || 0),
        0
      ),
      count: reviews.filter((review) => review.communication).length,
      icon: (
        <MessageCircle size={18} strokeWidth={1.5} className="text-[#222222]" />
      ),
      label: t("reviews.categories.communication"),
    },
    accuracy: {
      sum: reviews.reduce((sum, review) => sum + (review.accuracy || 0), 0),
      count: reviews.filter((review) => review.accuracy).length,
      icon: (
        <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#222222]" />
      ),
      label: t("reviews.categories.accuracy"),
    },
  };

  // Calculate average category ratings
  const getAvgCategory = (category: keyof typeof categoryRatings) => {
    return categoryRatings[category].count > 0
      ? categoryRatings[category].sum / categoryRatings[category].count
      : 0;
  };

  // Show first 3 reviews by default, or all if showAllReviews is true
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Calculate recommended percentage
  const recommendedCount = reviews.filter(
    (review) => review.recommended
  ).length;
  const recommendedPercentage =
    reviews.length > 0
      ? Math.round((recommendedCount / reviews.length) * 100)
      : 0;

  return (
    <Card className="p-0 border-0 rounded-none shadow-none pb-10">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg text-[#222222]">
          {t("reviews.title")}
          <span className="text-gray-500 font-normal text-xs ml-2">
            ({reviews.length})
          </span>
        </h4>
      </div>

      <CardContent className="space-y-6 p-0">
        {/* Rating breakdown */}
        {reviews.length > 0 && (
          <div className="grid gap-6 mb-6">
            <div className="flex flex-col justify-center items-center p-8 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Star size={36} className="fill-yellow-400 text-yellow-400" />
                <Star
                  size={42}
                  className="mb-5 fill-yellow-400 text-yellow-400"
                />
                <Star size={36} className="fill-yellow-400 text-yellow-400" />
              </div>
              {avgRating !== null && (
                <span className="font-bold text-5xl -mt-1 text-[#222222]">
                  {avgRating.toFixed(1)}
                </span>
              )}
              {recommendedPercentage > 0 && (
                <div className="text-sm text-gray-500 mt-2.5 text-center max-w-full md:max-w-[40%]">
                  {t("reviews.recommendedPercentage", {
                    percentage: recommendedPercentage,
                  })}
                </div>
              )}
              {/* Category ratings */}
              <div className="space-y-3 w-full mt-6">
                {Object.entries(categoryRatings).map(([key, value]) => {
                  if (value.count === 0) return null;
                  const avgValue = getAvgCategory(
                    key as keyof typeof categoryRatings
                  );

                  return (
                    <div key={key} className="flex items-center">
                      <div className="flex items-center gap-2 w-32">
                        {value.icon}
                        <span className="text-sm text-gray-600">
                          {value.label}
                        </span>
                      </div>
                      <Progress
                        className="flex-1 h-1.5 mx-3"
                        value={avgValue * 20}
                      />
                      <span className="text-sm font-medium w-9">
                        {avgValue.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Individual reviews */}
        <div className="space-y-6 mt-10">
          {displayedReviews.map((review, index) => (
            <div key={review.id}>
              {index > 0 && <Separator className="my-6" />}

              <div className="space-y-4">
                {/* Reviewer info and date */}
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                      {review.reviewer.profilePicture ? (
                        <Image
                          src={review.reviewer.profilePicture}
                          alt={`${review.reviewer.firstName || ""} ${
                            review.reviewer.lastName || ""
                          }`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-500 bg-gray-200">
                          {review.reviewer.firstName?.[0] || ""}
                          {review.reviewer.lastName?.[0] || ""}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {format(new Date(review.createdAt), "MMMM yyyy")}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review content */}
                <div>
                  {review.title && (
                    <h4 className="font-medium text-sm">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">
                      {review.comment}
                    </p>
                  )}
                </div>

                {/* Owner response */}
                {review.response && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h5 className="font-medium text-sm">
                      {t("reviews.responseFromOwner")}
                    </h5>
                    <p className="text-gray-700 text-sm mt-1">
                      {review.response}
                    </p>
                    {review.responseDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(review.responseDate), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show more button */}
        {reviews.length > 3 && !showAllReviews && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowAllReviews(true)}
              className="mt-6 text-sm font-medium text-[#222222]"
            >
              <span>{t("reviews.showAll", { count: reviews.length })}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
