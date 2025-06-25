"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Loader2, Star } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useTranslation } from "@/lib/i18n/client";

const FeedbackForm = () => {
  const { t } = useTranslation('common');
  const [currentRating, setCurrentRating] = useState(0);
  const [improvements, setImprovements] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    if (!currentRating || !improvements || !wouldRecommend || !email) {
      setError(t('feedback.error.missingFields'));
      setLoading(false);
      return;
    }

    const feedbackData = {
      rating: currentRating,
      email,
      improvement: improvements,
      wouldRentAgain: wouldRecommend,
    };

    try {
      const res = await fetch("/api/admin/platform-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (!res.ok) {
        throw new Error(t('feedback.error.submissionFailed'));
      }

      setCurrentRating(0);
      setImprovements("");
      setEmail("");
      setWouldRecommend(true);
      setShowSuccessMessage(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger className="font-medium ms-auto cursor-pointer">
        {t('feedback.triggerButton')}
      </DialogTrigger>
      <DialogContent className="p-8 rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('feedback.title')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('feedback.description')}
          </DialogDescription>
        </DialogHeader>
        {showSuccessMessage ? (
          <p>{t('feedback.successMessage')}</p>
        ) : (
          <div className="flex flex-col space-y-2">
            <Label>{t('feedback.ratingLabel')}</Label>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-0 rounded"
                  onClick={() => setCurrentRating(star)}
                >
                  <Star
                    className={`size-5 transition-colors ${
                      star <= currentRating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300 hover:text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Label className="mt-4">
              {t('feedback.improvementsLabel')}
            </Label>
            <span className="text-[13px] text-gray-600">
              {t('feedback.improvementsHint')}
            </span>
            <Textarea
              className="shadow-none mt-2 h-[250px] rounded-lg p-4 resize-none"
              placeholder={t('feedback.improvementsPlaceholder')}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
            />
            <Label className="mt-4">
              {t('feedback.recommendLabel')}
            </Label>
            <RadioGroup
              className="mt-2"
              value={wouldRecommend.toString()}
              onValueChange={(value) => setWouldRecommend(value === "true")}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="true" id="r1" />
                <Label htmlFor="r1">{t('feedback.yes')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="false" id="r2" />
                <Label htmlFor="r2">{t('feedback.no')}</Label>
              </div>
            </RadioGroup>
            <Label className="mt-4">{t('feedback.emailLabel')}</Label>
            <Input
              placeholder={t('feedback.emailPlaceholder')}
              className="h-11 rounded-lg mt-2 shadow-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!!error && (
              <p className="text-red-500 text-sm mt-2 -mb-1">{error}</p>
            )}
            <Button
              className="mt-4 rounded-lg h-11"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}{" "}
              {t('feedback.submitButton')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackForm;
