"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Loader2,
  RefreshCw,
  MessageSquare,
  Edit,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
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

export default function Reviews({ role, initialReviews = [] }: ReviewsProps) {
  // State management
  const [activeTab, setActiveTab] = useState("all");
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(initialReviews.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    positive: 0,
    improvement: 0,
  });
  const [averageRating, setAverageRating] = useState<number | null>(null);

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

  // Memoized formatters
  const formatters = useMemo(
    () => ({
      date: new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      monthYear: new Intl.DateTimeFormat("nl-NL", {
        month: "long",
        year: "numeric",
      }),
    }),
    []
  );

  // Fetch reviews based on role
  const fetchReviews = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Use fetch with caching headers appropriately
        const response = await fetch(`/api/user/profile/reviews?role=${role}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Only bypass cache on explicit refresh
            ...(isRefresh ? { "Cache-Control": "no-cache" } : {}),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch reviews");
        }

        const data = await response.json();

        // Verify that the data has the expected structure
        if (!data) {
          throw new Error("Empty response received from API");
        }

        // Ensure we have an array (empty array if null/undefined)
        const reviewsData = Array.isArray(data.reviews) ? data.reviews : [];

        setReviews(reviewsData);

        // Only fetch counts if this is an initial load or explicit refresh
        if (isRefresh || !counts.total) {
          fetchCounts();
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch reviews"
        );
        // Set empty reviews array if there was an error
        setReviews([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [role, counts.total]
  );

  // Fetch review counts
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/user/profile/reviews/counts?role=${role}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Add cache: 'force-cache' to use HTTP cache when available
          cache: "force-cache",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Validate data structure and provide defaults
        const total = typeof data.total === "number" ? data.total : 0;
        const positive = typeof data.positive === "number" ? data.positive : 0;
        const improvement =
          typeof data.improvement === "number" ? data.improvement : 0;

        setCounts({
          total,
          positive,
          improvement,
        });

        if (typeof data.averageRating === "number") {
          setAverageRating(data.averageRating);
        }
      } else {
        // Set default values on error
        setCounts({
          total: 0,
          positive: 0,
          improvement: 0,
        });
        setAverageRating(null);
      }
    } catch (err) {
      console.error("Error fetching counts:", err);
      // Set default values on error
      setCounts({
        total: 0,
        positive: 0,
        improvement: 0,
      });
      setAverageRating(null);
    }
  }, [role]);

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

      // Update the local state
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

      toast({
        title: "Response submitted",
        description: "Your response has been saved successfully.",
      });

      // Close the dialog and reset state
      setResponseDialogOpen(false);
      setResponseText("");
      setSelectedReview(null);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to submit response",
        variant: "destructive",
      });
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

      // Update the local state
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

      // Refresh counts as the rating might have changed
      fetchCounts();

      toast({
        title: "Review updated",
        description: "Your review has been updated successfully.",
      });

      // Close the dialog and reset state
      setEditDialogOpen(false);
      setSelectedReview(null);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update review",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedReview, editedReview, toast, fetchCounts]);

  // Fetch data on component mount
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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

  const title = role === "LESSOR" ? "Ontvangen reviews" : "Geplaatste reviews";
  const description =
    role === "LESSOR"
      ? "Bekijk wat huurders over jouw aanhangers zeggen"
      : "Reviews die jij hebt achtergelaten over gehuurde aanhangers";

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
    (review: ReviewData, isLastItem: boolean) => (
      <Card key={review.id} className="p-0 border-0 shadow-none">
        <CardContent className="p-0">
          <div
            className={`flex flex-col ${
              !isLastItem ? "border-b pb-6" : ""
            } space-y-4`}
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
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
                    />
                  ) : role !== "LESSOR" && review.trailerImage ? (
                    <Image
                      src={review.trailerImage}
                      alt={review.trailerTitle || ""}
                      fill
                      className="object-cover"
                      sizes="48px"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
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
                        ? review.reviewerName || "Anonymous"
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

            {/* Owner response - only shown for lessors or if there is a response */}
            {review.response && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h5 className="font-medium text-sm">
                  Antwoord van de eigenaar
                </h5>
                <p className="text-gray-700 text-sm mt-1">{review.response}</p>
                {review.responseDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(review.responseDate)}
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
                  {review.response ? <>Wijzig antwoord</> : <>Reageren</>}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(review)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Review
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

  // Empty state component for when there are no reviews
  const renderEmptyState = useCallback(
    (type: "all" | "positive" | "improvement") => {
      const messages = {
        all: {
          title: "Geen recensies",
          message:
            role === "LESSOR"
              ? "Je hebt nog geen recensies ontvangen voor je aanhangers."
              : "Je hebt nog geen recensies achtergelaten voor gehuurde aanhangers.",
        },
        positive: {
          title: "Geen positieve recensies",
          message:
            role === "LESSOR"
              ? "Je hebt nog geen positieve recensies ontvangen voor je aanhangers."
              : "Je hebt nog geen positieve recensies achtergelaten.",
        },
        improvement: {
          title: "Geen verbeterpunten",
          message:
            role === "LESSOR"
              ? "Je hebt geen recensies ontvangen met verbeterpunten."
              : "Je hebt geen recensies achtergelaten met verbeterpunten.",
        },
      };

      return (
        <Card className="border-0 shadow-none bg-[#f6f8f9]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <Star className="h-10 w-10 mb-4" strokeWidth={1.5} />
            <h3 className="font-medium text-lg">{messages[type].title}</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {messages[type].message}
            </p>
            {role !== "LESSOR" && (
              <Button className="mt-4">Schrijf een recensie</Button>
            )}
          </CardContent>
        </Card>
      );
    },
    [role]
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1 text-[#222222] tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Card className="border-0 shadow-none bg-[#f6f8f9]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="font-medium text-lg">Loading reviews...</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl mb-1 font-semibold text-[#222222] tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Card className="border-0 shadow-none bg-[#f8f6f6]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <div className="text-destructive mb-4 text-3xl">!</div>
            <h3 className="font-medium text-lg">Error loading reviews</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchReviews()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1 text-[#222222] tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
        {role === "LESSOR" && averageRating && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} gemiddelde rating
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full mt-9">
        <div className="flex justify-between items-center">
          <TabsList className="bg-white pb-[25px] rounded-0 flex items-center justify-start rounded-none">
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="all"
              onClick={() => setActiveTab("all")}
            >
              Alle recensies {counts.total > 0 && `(${counts.total})`}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="positive"
              onClick={() => setActiveTab("positive")}
            >
              Positief {counts.positive > 0 && `(${counts.positive})`}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="improvement"
              onClick={() => setActiveTab("improvement")}
            >
              Verbeterpunten{" "}
              {counts.improvement > 0 && `(${counts.improvement})`}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4">
          {filteredReviews.all.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.all.map((review, index) =>
                renderReviewCard(
                  review,
                  index === filteredReviews.all.length - 1
                )
              )}
            </div>
          ) : (
            renderEmptyState("all")
          )}
        </TabsContent>

        <TabsContent value="positive" className="mt-4">
          {filteredReviews.positive.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.positive.map((review, index) =>
                renderReviewCard(
                  review,
                  index === filteredReviews.positive.length - 1
                )
              )}
            </div>
          ) : (
            renderEmptyState("positive")
          )}
        </TabsContent>

        <TabsContent value="improvement" className="mt-4">
          {filteredReviews.improvement.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.improvement.map((review, index) =>
                renderReviewCard(
                  review,
                  index === filteredReviews.improvement.length - 1
                )
              )}
            </div>
          ) : (
            renderEmptyState("improvement")
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog - For lessors to respond to reviews */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-8">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.response
                ? "Wijzig je antwoord"
                : "Reageer op review"}
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.response
                ? "Wijzig jouw antwoord op deze gegeven review."
                : "Schrijf een antwoord op deze review, deze wordt publiekelijk getoond."}
            </DialogDescription>
          </DialogHeader>

          {/* Original review summary */}
          <div className="bg-muted p-4 rounded-md mt-0 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Review</span>
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
                Jouw antwoord
              </label>
              <Textarea
                id="response"
                placeholder="Write your response..."
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
              Annuleren
            </Button>
            <Button
              type="button"
              onClick={submitResponse}
              disabled={responseText.trim().length === 0 || isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  {selectedReview?.response
                    ? "Wijzig antwoord"
                    : "Beantwoorden"}
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
            <DialogTitle>Wijzig review</DialogTitle>
            <DialogDescription>
              Update your review for "{selectedReview?.trailerTitle}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-0">
            {/* Rating selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex mt-2">
                {renderStars(editedReview.rating, true, (rating) => {
                  setEditedReview((prev) => ({ ...prev, rating }));
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="review-title" className="text-sm font-medium">
                Titel (optioneel)
              </label>
              <Input
                id="review-title"
                className="shadow-none rounded-lg h-11 mt-2"
                placeholder="Summarize your experience"
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
                Review
              </label>
              <Textarea
                id="review-comment"
                className="shadow-none rounded-lg resize-none mt-2"
                placeholder="Share your experience..."
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
              Annuleren
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
                  Opslaan...
                </>
              ) : (
                <>Wijzig review</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
