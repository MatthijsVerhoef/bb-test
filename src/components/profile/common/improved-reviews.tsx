"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Loader2, Edit } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import ReviewSkeleton from "./ReviewSkeleton";

interface ReviewData {
  id: string;
  rating: number;
  title?: string | null;
  comment: string | null;
  response?: string | null;
  responseDate?: Date | null;
  createdAt: Date;
  trailerTitle?: string | null;
  trailerImage?: string | null;
  reviewerName?: string | null;
  reviewerId?: string | null;
  reviewerImage?: string | null;
  cleanliness?: number | null;
  maintenance?: number | null;
  valueForMoney?: number | null;
  communication?: number | null;
  accuracy?: number | null;
  recommended?: boolean | null;
}

interface ReviewsProps {
  role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
  initialReviews?: ReviewData[];
}

export default function ImprovedReviews({
  role,
  initialReviews = [],
}: ReviewsProps) {
  // State management
  const [activeTab, setActiveTab] = useState("all");
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    positive: 0,
    improvement: 0,
  });
  const [averageRating, setAverageRating] = useState<number | null>(null);

  // Track if initial fetch has been done (helps in development with StrictMode)
  const hasFetchedInitialData = useRef(false);

  // Response dialog state
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedReview, setEditedReview] = useState<{
    title: string;
    comment: string;
    rating: number;
  }>({
    title: "",
    comment: "",
    rating: 5,
  });

  const { toast } = useToast();
  const { t } = useTranslation("profile");
  
  // Determine the locale for formatting based on selected language
  const locale = t('common:locale') === 'nl' ? 'nl-NL' : 
                t('common:locale') === 'de' ? 'de-DE' : 'en-US';

  // Memoized formatters
  const formatters = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      monthYear: new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }),
    }),
    [locale]
  );

  // Fetch counts - stable function
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/user/profile/reviews/counts?role=${role}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "default",
        }
      );

      if (response.ok) {
        const data = await response.json();

        setCounts({
          total: data.total || 0,
          positive: data.positive || 0,
          improvement: data.improvement || 0,
        });

        if (typeof data.averageRating === "number") {
          setAverageRating(data.averageRating);
        }
      }
    } catch (err) {
      console.error("Error fetching counts:", err);
      setCounts({ total: 0, positive: 0, improvement: 0 });
      setAverageRating(null);
    }
  }, [role]);

  // Fetch reviews - stable function
  const fetchReviews = useCallback(
    async (isRefresh = false) => {
      try {
        // Only show loading state if we don't have any data
        if (!isRefresh && reviews.length === 0) {
          setIsLoading(true);
        } else if (isRefresh) {
          setIsRefreshing(true);
        }

        setError(null);

        const response = await fetch(`/api/user/profile/reviews?role=${role}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(isRefresh ? { "Cache-Control": "no-cache" } : {}),
          },
          cache: "default",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch reviews");
        }

        const data = await response.json();
        const reviewsData = Array.isArray(data.reviews) ? data.reviews : [];

        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch reviews"
        );
        setReviews([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [role]
  );

  // Submit a response to a review (for lessors)
  const submitResponse = useCallback(async () => {
    if (!selectedReview) return;

    try {
      setIsRefreshing(true);

      const response = await fetch(
        `/api/user/profile/reviews/${selectedReview.id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            response: responseText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit response");
      }

      // Update the local state optimistically
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === selectedReview.id
            ? {
                ...review,
                response: responseText,
                responseDate: new Date(),
              }
            : review
        )
      );

      // Close the dialog and reset state
      setResponseDialogOpen(false);
      setResponseText("");
      setSelectedReview(null);
    } catch (err) {
      console.error("Error reacting to revies", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedReview, responseText, toast]);

  // Edit a review (for users)
  const editReview = useCallback(async () => {
    if (!selectedReview) return;

    try {
      setIsRefreshing(true);

      const response = await fetch(
        `/api/user/profile/reviews/${selectedReview.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editedReview.title,
            comment: editedReview.comment,
            rating: editedReview.rating,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update review");
      }

      // Update the local state optimistically
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === selectedReview.id
            ? {
                ...review,
                title: editedReview.title,
                comment: editedReview.comment,
                rating: editedReview.rating,
              }
            : review
        )
      );

      fetchCounts();

      // Close the dialog and reset state
      setEditDialogOpen(false);
      setSelectedReview(null);
    } catch (err) {
      console.error("Error updating review", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedReview, editedReview, toast, fetchCounts]);

  // Initial data fetch - handles StrictMode double rendering gracefully
  useEffect(() => {
    // If we already have initial reviews, just fetch counts
    if (initialReviews.length > 0 && !hasFetchedInitialData.current) {
      hasFetchedInitialData.current = true;
      fetchCounts();
    }
    // If no initial reviews and haven't fetched yet, fetch everything
    else if (initialReviews.length === 0 && !hasFetchedInitialData.current) {
      hasFetchedInitialData.current = true;
      Promise.all([fetchReviews(), fetchCounts()]);
    }
  }, []); // Empty deps - only run on mount

  // Format date using memoized formatter
  const formatDate = useCallback(
    (date: Date) => {
      return formatters.date.format(new Date(date));
    },
    [formatters]
  );

  // Format date to month and year only
  const formatMonthYear = useCallback(
    (date: Date) => {
      return formatters.monthYear.format(new Date(date));
    },
    [formatters]
  );

  // Memoized star rating component
  const renderStars = useCallback(
    (
      rating: number,
      isInteractive = false,
      onSelect?: (rating: number) => void
    ) => {
      return (
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              } ${
                isInteractive
                  ? "cursor-pointer hover:scale-110 transition-transform"
                  : ""
              }`}
              onClick={
                isInteractive && onSelect ? () => onSelect(i + 1) : undefined
              }
            />
          ))}
        </div>
      );
    },
    []
  );

  const title = role === "LESSOR" ? t('reviews.lessor.title') : t('reviews.user.title');
  const description = role === "LESSOR" ? t('reviews.lessor.description') : t('reviews.user.description');

  // Memoized filtered reviews for different tabs
  const filteredReviews = useMemo(
    () => ({
      all: reviews,
      positive: reviews.filter((review) => review.rating >= 4),
      improvement: reviews.filter((review) => review.rating < 4),
    }),
    [reviews]
  );

  // Open response dialog for a review
  const handleResponseClick = useCallback((review: ReviewData) => {
    setSelectedReview(review);
    setResponseText(review.response || "");
    setResponseDialogOpen(true);
  }, []);

  // Open edit dialog for a review
  const handleEditClick = useCallback((review: ReviewData) => {
    setSelectedReview(review);
    setEditedReview({
      title: review.title || "",
      comment: review.comment || "",
      rating: review.rating,
    });
    setEditDialogOpen(true);
  }, []);

  // Render a single review card
  const renderReviewCard = useCallback(
    (review: ReviewData, isLastItem: boolean, index: number = 0) => (
      <Card key={review.id} className="p-0 border-0 shadow-none">
        <CardContent className="p-0">
          <div
            className={`flex flex-col ${
              !isLastItem ? "border-b pb-6" : ""
            } space-y-4`}
            style={{
              opacity: 0,
              animation: `fadeIn 0.5s ease-out ${100 + index * 50}ms forwards`,
            }}
          >
            {/* Reviewer and trailer info */}
            <div className="flex justify-between">
              <div className="flex items-start">
                {/* Reviewer image or trailer image depending on role */}
                <div className="relative h-12 w-12 rounded-full overflow-hidden mr-3 bg-gray-200">
                  {role === "LESSOR" && review.reviewerImage ? (
                    <Image
                      src={review.reviewerImage}
                      alt={review.reviewerName || ""}
                      fill
                      className="object-cover"
                      sizes="48px"
                      loading="lazy"
                    />
                  ) : role !== "LESSOR" && review.trailerImage ? (
                    <Image
                      src={review.trailerImage}
                      alt={review.trailerTitle || ""}
                      fill
                      className="object-cover"
                      sizes="48px"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 bg-gray-200">
                      {role === "LESSOR"
                        ? review.reviewerName?.[0] || ""
                        : review.trailerTitle?.[0] || ""}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {role === "LESSOR"
                        ? review.reviewerName || t('reviews.review.anonymous')
                        : review.trailerTitle || "Trailer"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {formatMonthYear(review.createdAt)}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex">{renderStars(review.rating)}</div>
            </div>

            {/* Review content */}
            <div className="space-y-2">
              {review.title && (
                <h4 className="font-medium text-sm">{review.title}</h4>
              )}
              {review.comment && (
                <p className="text-gray-700 text-sm whitespace-pre-line">
                  {review.comment}
                </p>
              )}
            </div>

            {/* Owner response */}
            {review.response && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h5 className="font-medium text-sm">
                  {t('reviews.response.title')}
                </h5>
                <p className="text-gray-700 text-sm mt-1">{review.response}</p>
                {review.responseDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('reviews.response.date', { date: formatDate(review.responseDate) })}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              {role === "LESSOR" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResponseClick(review)}
                  className="flex items-center gap-1"
                >
                  {review.response ? t('reviews.actions.editResponse') : t('reviews.actions.respond')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(review)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  {t('reviews.actions.editReview')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [
      role,
      formatMonthYear,
      formatDate,
      renderStars,
      handleResponseClick,
      handleEditClick,
    ]
  );

  // Empty state component
  const renderEmptyState = useCallback(
    (type: "all" | "positive" | "improvement") => {
      const roleKey = role === "LESSOR" ? "lessor" : "user";
      
      return (
        <Card className="border-0 shadow-none bg-[#f6f8f9]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <Star className="h-10 w-10 mb-4" strokeWidth={1.5} />
            <h3 className="font-medium text-lg">
              {t(`reviews.emptyStates.${type}.${roleKey}.title`)}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {t(`reviews.emptyStates.${type}.${roleKey}.message`)}
            </p>
            {role !== "LESSOR" && (
              <Button className="mt-4">{t('reviews.review.writeReview')}</Button>
            )}
          </CardContent>
        </Card>
      );
    },
    [role, t]
  );

  // Header with title, description and average rating
  const renderHeader = () => (
    <div className="animate-in fade-in-50 duration-300">
      <h2 className="text-2xl font-semibold mb-1 text-[#222222] tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground">{description}</p>
      {role === "LESSOR" && averageRating !== null && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex">{renderStars(Math.round(averageRating))}</div>
          <span className="text-sm text-gray-600">
            {t('reviews.lessor.avgRating', { rating: averageRating.toFixed(1) })}
          </span>
        </div>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <ReviewSkeleton count={3} includeResponse={role === "LESSOR"} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <Card className="border-0 shadow-none bg-[#f8f6f6]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <div className="text-destructive mb-4 text-3xl">!</div>
            <h3 className="font-medium text-lg">{t('reviews.error.title')}</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchReviews(true)}
            >
              {t('reviews.error.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add the CSS for animations to your global styles or as a style tag
  const animationStyles = (
    <style jsx global>{`
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style>
  );

  return (
    <>
      {animationStyles}
      <div className="space-y-6">
        {renderHeader()}

        <Tabs defaultValue="all" className="w-full mt-9">
          <div className="flex justify-between items-center animate-in fade-in-50 duration-200 ease-out">
            <TabsList className="bg-white pb-[25px] rounded-0 flex items-center justify-start rounded-none">
              <TabsTrigger
                className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
                value="all"
                onClick={() => setActiveTab("all")}
              >
                {t('reviews.tabs.all')} {counts.total > 0 && `(${counts.total})`}
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
                value="positive"
                onClick={() => setActiveTab("positive")}
              >
                {t('reviews.tabs.positive')} {counts.positive > 0 && `(${counts.positive})`}
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
                value="improvement"
                onClick={() => setActiveTab("improvement")}
              >
                {t('reviews.tabs.improvement')}{" "}
                {counts.improvement > 0 && `(${counts.improvement})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-4">
            <div className="animate-in fade-in-0 duration-500 ease-out">
              {filteredReviews.all.length > 0 ? (
                <div className="space-y-6">
                  {filteredReviews.all.map((review, index) =>
                    renderReviewCard(
                      review,
                      index === filteredReviews.all.length - 1,
                      index
                    )
                  )}
                </div>
              ) : (
                renderEmptyState("all")
              )}
            </div>
          </TabsContent>

          <TabsContent value="positive" className="mt-4">
            <div className="animate-in fade-in-0 duration-500 ease-out">
              {filteredReviews.positive.length > 0 ? (
                <div className="space-y-6">
                  {filteredReviews.positive.map((review, index) =>
                    renderReviewCard(
                      review,
                      index === filteredReviews.positive.length - 1,
                      index
                    )
                  )}
                </div>
              ) : (
                renderEmptyState("positive")
              )}
            </div>
          </TabsContent>

          <TabsContent value="improvement" className="mt-4">
            <div className="animate-in fade-in-0 duration-500 ease-out">
              {filteredReviews.improvement.length > 0 ? (
                <div className="space-y-6">
                  {filteredReviews.improvement.map((review, index) =>
                    renderReviewCard(
                      review,
                      index === filteredReviews.improvement.length - 1,
                      index
                    )
                  )}
                </div>
              ) : (
                renderEmptyState("improvement")
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Response Dialog - For lessors to respond to reviews */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-8">
            <DialogHeader>
              <DialogTitle>
                {selectedReview?.response
                  ? t('reviews.dialogs.response.editTitle')
                  : t('reviews.dialogs.response.title')}
              </DialogTitle>
              <DialogDescription>
                {selectedReview?.response
                  ? t('reviews.dialogs.response.editDescription')
                  : t('reviews.dialogs.response.description')}
              </DialogDescription>
            </DialogHeader>

            {/* Original review summary */}
            <div className="bg-muted p-4 rounded-md mt-0 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{t('reviews.dialogs.response.reviewLabel')}</span>
                <div className="flex">
                  {selectedReview && renderStars(selectedReview.rating)}
                </div>
              </div>
              {selectedReview?.title && (
                <p className="text-sm font-medium">{selectedReview.title}</p>
              )}
              {selectedReview?.comment && (
                <p className="text-sm">{selectedReview.comment}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="response" className="text-sm font-medium">
                  {t('reviews.dialogs.response.responseLabel')}
                </label>
                <Textarea
                  id="response"
                  placeholder={t('reviews.dialogs.response.responsePlaceholder')}
                  value={responseText}
                  className="mt-2 resize-none rounded-lg shadow-none"
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResponseDialogOpen(false)}
              >
                {t('reviews.dialogs.response.buttons.cancel')}
              </Button>
              <Button
                type="button"
                onClick={submitResponse}
                disabled={responseText.trim().length === 0 || isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('reviews.dialogs.response.buttons.saving')}
                  </>
                ) : (
                  <>
                    {selectedReview?.response
                      ? t('reviews.dialogs.response.buttons.update')
                      : t('reviews.dialogs.response.buttons.respond')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Review Dialog - For users to edit their reviews */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-8">
            <DialogHeader>
              <DialogTitle>{t('reviews.dialogs.edit.title')}</DialogTitle>
              <DialogDescription>
                {t('reviews.dialogs.edit.description', { trailerTitle: selectedReview?.trailerTitle })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-0">
              {/* Rating selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reviews.dialogs.edit.rating')}</label>
                <div className="flex mt-2">
                  {renderStars(editedReview.rating, true, (rating) => {
                    setEditedReview((prev) => ({ ...prev, rating }));
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="review-title" className="text-sm font-medium">
                  {t('reviews.dialogs.edit.titleLabel')}
                </label>
                <Input
                  id="review-title"
                  className="shadow-none rounded-lg h-11 mt-2"
                  placeholder={t('reviews.dialogs.edit.titlePlaceholder')}
                  value={editedReview.title}
                  onChange={(e) =>
                    setEditedReview((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label htmlFor="review-comment" className="text-sm font-medium">
                  {t('reviews.dialogs.edit.reviewLabel')}
                </label>
                <Textarea
                  id="review-comment"
                  className="shadow-none rounded-lg resize-none mt-2"
                  placeholder={t('reviews.dialogs.edit.reviewPlaceholder')}
                  value={editedReview.comment}
                  onChange={(e) =>
                    setEditedReview((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t('reviews.dialogs.edit.buttons.cancel')}
              </Button>
              <Button
                type="button"
                onClick={editReview}
                disabled={
                  editedReview.comment.trim().length === 0 || isRefreshing
                }
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('reviews.dialogs.edit.buttons.saving')}
                  </>
                ) : (
                  <>{t('reviews.dialogs.edit.buttons.update')}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
