"use client";

import { useState, useCallback, useMemo, memo } from "react";
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
import { useReviews } from "@/hooks/use-reviews";
import type { ReviewData } from "@/hooks/use-reviews";

// Memoized review card component
const ReviewCard = memo(
  ({
    review,
    role,
    isLast,
    onRespond,
    onEdit,
  }: {
    review: ReviewData;
    role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
    isLast: boolean;
    onRespond?: (review: ReviewData) => void;
    onEdit?: (review: ReviewData) => void;
  }) => {
    const { t } = useTranslation("profile");

    const formatMonthYear = (date: Date) => {
      return new Intl.DateTimeFormat(
        t("common:locale") === "nl" ? "nl-NL" : "en-US",
        {
          month: "long",
          year: "numeric",
        }
      ).format(new Date(date));
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat(
        t("common:locale") === "nl" ? "nl-NL" : "en-US",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      ).format(new Date(date));
    };

    const renderStars = (rating: number) => {
      return (
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
      );
    };

    return (
      <Card className="p-0 border-0 shadow-none">
        <CardContent className="p-0">
          <div
            className={`flex flex-col ${
              !isLast ? "border-b pb-6" : ""
            } space-y-4`}
          >
            {/* Reviewer and trailer info */}
            <div className="flex justify-between">
              <div className="flex items-start">
                {/* Image */}
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
                        ? review.reviewerName || t("reviews.review.anonymous")
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
                  {t("reviews.response.title")}
                </h5>
                <p className="text-gray-700 text-sm mt-1">{review.response}</p>
                {review.responseDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t("reviews.response.date", {
                      date: formatDate(review.responseDate),
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              {role === "LESSOR" && onRespond ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRespond(review)}
                  className="flex items-center gap-1"
                >
                  {review.response
                    ? t("reviews.actions.editResponse")
                    : t("reviews.actions.respond")}
                </Button>
              ) : role === "USER" && onEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(review)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  {t("reviews.actions.editReview")}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ReviewCard.displayName = "ReviewCard";

// Empty state component
const EmptyState = memo(({ type, role }: { type: string; role: string }) => {
  const { t } = useTranslation("profile");
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
          <Button className="mt-4">{t("reviews.review.writeReview")}</Button>
        )}
      </CardContent>
    </Card>
  );
});

EmptyState.displayName = "EmptyState";

// Main component
export default function ImprovedReviews({
  role,
}: {
  role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
}) {
  const { t } = useTranslation("profile");
  const { toast } = useToast();

  const {
    reviews,
    counts,
    isLoading,
    error,
    respondToReview,
    editReview,
    isResponding,
    isEditing,
  } = useReviews(role);

  // Dialog states
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedReview, setEditedReview] = useState({
    title: "",
    comment: "",
    rating: 5,
  });

  // Filtered reviews
  const filteredReviews = useMemo(
    () => ({
      all: reviews,
      positive: reviews.filter((review) => review.rating >= 4),
      improvement: reviews.filter((review) => review.rating < 4),
    }),
    [reviews]
  );

  // Star rating component
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

  // Handle response dialog
  const handleResponseClick = useCallback((review: ReviewData) => {
    setSelectedReview(review);
    setResponseText(review.response || "");
    setResponseDialogOpen(true);
  }, []);

  // Handle edit dialog
  const handleEditClick = useCallback((review: ReviewData) => {
    setSelectedReview(review);
    setEditedReview({
      title: review.title || "",
      comment: review.comment || "",
      rating: review.rating,
    });
    setEditDialogOpen(true);
  }, []);

  // Submit response
  const submitResponse = useCallback(() => {
    if (!selectedReview) return;

    respondToReview(
      { reviewId: selectedReview.id, response: responseText },
      {
        onSuccess: () => {
          setResponseDialogOpen(false);
          setResponseText("");
          setSelectedReview(null);
          toast({
            title: t("reviews.success.responseSubmitted"),
            description: t("reviews.success.responseDescription"),
          });
        },
        onError: () => {
          toast({
            title: t("reviews.error.responseTitle"),
            description: t("reviews.error.responseDescription"),
            variant: "destructive",
          });
        },
      }
    );
  }, [selectedReview, responseText, respondToReview, toast, t]);

  // Submit edit
  const submitEdit = useCallback(() => {
    if (!selectedReview) return;

    editReview(
      {
        reviewId: selectedReview.id,
        title: editedReview.title,
        comment: editedReview.comment,
        rating: editedReview.rating,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedReview(null);
          toast({
            title: t("reviews.success.reviewUpdated"),
            description: t("reviews.success.reviewDescription"),
          });
        },
        onError: () => {
          toast({
            title: t("reviews.error.updateTitle"),
            description: t("reviews.error.updateDescription"),
            variant: "destructive",
          });
        },
      }
    );
  }, [selectedReview, editedReview, editReview, toast, t]);

  const title =
    role === "LESSOR" ? t("reviews.lessor.title") : t("reviews.user.title");
  const description =
    role === "LESSOR"
      ? t("reviews.lessor.description")
      : t("reviews.user.description");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1 text-[#222222] tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1 text-[#222222] tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Card className="border-0 shadow-none bg-[#f8f6f6]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <div className="text-destructive mb-4 text-3xl">!</div>
            <h3 className="font-medium text-lg">{t("reviews.error.title")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {error instanceof Error
                ? error.message
                : t("reviews.error.message")}
            </p>
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
        {role === "LESSOR" && counts.averageRating !== null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex">
              {renderStars(Math.round(counts.averageRating))}
            </div>
            <span className="text-sm text-gray-600">
              {t("reviews.lessor.avgRating", {
                rating: counts.averageRating.toFixed(1),
              })}
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full mt-9">
        <TabsList className="bg-white pb-[25px] rounded-0 flex items-center justify-start rounded-none">
          <TabsTrigger
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
            value="all"
          >
            {t("reviews.tabs.all")} {counts.total > 0 && `(${counts.total})`}
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
            value="positive"
          >
            {t("reviews.tabs.positive")}{" "}
            {counts.positive > 0 && `(${counts.positive})`}
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
            value="improvement"
          >
            {t("reviews.tabs.improvement")}{" "}
            {counts.improvement > 0 && `(${counts.improvement})`}
          </TabsTrigger>
        </TabsList>

        {Object.entries(filteredReviews).map(([key, reviews]) => (
          <TabsContent key={key} value={key} className="mt-4">
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    role={role}
                    isLast={index === reviews.length - 1}
                    onRespond={
                      role === "LESSOR" ? handleResponseClick : undefined
                    }
                    onEdit={role === "USER" ? handleEditClick : undefined}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type={key} role={role} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-8">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.response
                ? t("reviews.dialogs.response.editTitle")
                : t("reviews.dialogs.response.title")}
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.response
                ? t("reviews.dialogs.response.editDescription")
                : t("reviews.dialogs.response.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted p-4 rounded-md mt-0 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">
                {t("reviews.dialogs.response.reviewLabel")}
              </span>
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
                {t("reviews.dialogs.response.responseLabel")}
              </label>
              <Textarea
                id="response"
                placeholder={t("reviews.dialogs.response.responsePlaceholder")}
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
              {t("reviews.dialogs.response.buttons.cancel")}
            </Button>
            <Button
              type="button"
              onClick={submitResponse}
              disabled={responseText.trim().length === 0 || isResponding}
            >
              {isResponding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("reviews.dialogs.response.buttons.saving")}
                </>
              ) : (
                <>
                  {selectedReview?.response
                    ? t("reviews.dialogs.response.buttons.update")
                    : t("reviews.dialogs.response.buttons.respond")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-8">
          <DialogHeader>
            <DialogTitle>{t("reviews.dialogs.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("reviews.dialogs.edit.description", {
                trailerTitle: selectedReview?.trailerTitle,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-0">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("reviews.dialogs.edit.rating")}
              </label>
              <div className="flex mt-2">
                {renderStars(editedReview.rating, true, (rating) => {
                  setEditedReview((prev) => ({ ...prev, rating }));
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="review-title" className="text-sm font-medium">
                {t("reviews.dialogs.edit.titleLabel")}
              </label>
              <Input
                id="review-title"
                className="shadow-none rounded-lg h-11 mt-2"
                placeholder={t("reviews.dialogs.edit.titlePlaceholder")}
                value={editedReview.title}
                onChange={(e) =>
                  setEditedReview((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="review-comment" className="text-sm font-medium">
                {t("reviews.dialogs.edit.reviewLabel")}
              </label>
              <Textarea
                id="review-comment"
                className="shadow-none rounded-lg resize-none mt-2"
                placeholder={t("reviews.dialogs.edit.reviewPlaceholder")}
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
              {t("reviews.dialogs.edit.buttons.cancel")}
            </Button>
            <Button
              type="button"
              onClick={submitEdit}
              disabled={editedReview.comment.trim().length === 0 || isEditing}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("reviews.dialogs.edit.buttons.saving")}
                </>
              ) : (
                <>{t("reviews.dialogs.edit.buttons.update")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
