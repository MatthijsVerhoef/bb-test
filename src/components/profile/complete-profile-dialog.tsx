"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/stores/auth.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  UserPlus,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Heart,
  MapPin,
  Phone,
  User,
  Home,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

interface CompleteProfileDialogProps {
  children: React.ReactNode;
  user: any;
  isWelcome?: boolean;
  autoOpen?: boolean;
  onComplete?: () => void;
}

export function CompleteProfileDialog({
  children,
  user,
  isWelcome = false,
  autoOpen = false,
  onComplete,
}: CompleteProfileDialogProps) {
  const { updateProfile } = useAuth();
  const { t } = useTranslation("profile");
  const [open, setOpen] = useState(autoOpen);
  const [currentStep, setCurrentStep] = useState(isWelcome ? 0 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    postalCode: user?.postalCode || "",
    country: user?.country || t("personalInfo.form.defaultCountry"),
    bio: user?.bio || "",
  });

  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Update profile with all form data
      const updatedUser = await updateProfile(formData);
      setSuccess(true);

      // Mark profile as visited and welcome as seen
      localStorage.setItem("buurbak-profile-visited", "true");
      localStorage.setItem("buurbak-welcome-dismissed", "true");

      // Store a separate copy of the profile data as backup
      // This ensures the data persists even if the session token doesn't include it
      try {
        const profileData = {
          ...formData,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(
          "buurbak-profile-data",
          JSON.stringify(profileData)
        );
      } catch (e) {
        console.error("Failed to store profile backup:", e);
      }

      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        if (onComplete) {
          onComplete();
        }
      }, 2000);
    } catch (error: any) {
      setError(error.message || t("personalInfo.form.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    localStorage.setItem("buurbak-profile-visited", "true");
    localStorage.setItem("buurbak-welcome-dismissed", "true");
    setOpen(false);
    if (onComplete) {
      onComplete();
    }
  };

  // Check if profile is incomplete
  const isProfileIncomplete = !user?.phone || !user?.address || !user?.city;
  const requiredFieldsFilled =
    formData.phone && formData.address && formData.city;

  const steps = [
    {
      title: t("personalInfo.incomplete.welcome.title"),
      subtitle: t("personalInfo.incomplete.welcome.subtitle"),
      content: (
        <div className="space-y-6 text-center py-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {t("personalInfo.incomplete.welcome.heading")}
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
              {t("personalInfo.incomplete.welcome.description")}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: isWelcome
        ? t("personalInfo.incomplete.fillDetails")
        : t("personalInfo.incomplete.completeProfile"),
      subtitle: isWelcome
        ? t("personalInfo.incomplete.almostThere")
        : t("personalInfo.incomplete.fillMissingInfo"),
      content: (
        <form onSubmit={handleSubmit} className="space-y-4 overflow-visible">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              {t("personalInfo.form.phone")}
              {!user?.phone && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+31 6 12345678"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              className="h-11 border-gray-200 focus:border-orange-300 focus:ring-orange-300"
            />
            {!user?.phone && (
              <p className="text-xs text-gray-500">
                {t("personalInfo.form.phoneRequired")}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              {t("personalInfo.form.address")}
              {!user?.address && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder={t("personalInfo.form.addressPlaceholder")}
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              className="h-11 border-gray-200 focus:border-orange-300 focus:ring-orange-300"
            />
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">
                {t("personalInfo.form.postalCode")}
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                type="text"
                placeholder={t("personalInfo.form.postalCodePlaceholder")}
                value={formData.postalCode}
                onChange={handleChange}
                disabled={isLoading}
                className="h-11 border-gray-200 focus:border-orange-300 focus:ring-orange-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1">
                {t("personalInfo.form.city")}
                {!user?.city && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="city"
                name="city"
                type="text"
                placeholder={t("personalInfo.form.cityPlaceholder")}
                value={formData.city}
                onChange={handleChange}
                disabled={isLoading}
                className="h-11 border-gray-200 focus:border-orange-300 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">{t("personalInfo.form.country")}</Label>
            <Input
              id="country"
              name="country"
              type="text"
              placeholder={t("personalInfo.form.defaultCountry")}
              value={formData.country}
              onChange={handleChange}
              disabled={isLoading}
              className="h-11 border-gray-200 focus:border-orange-300 focus:ring-orange-300"
            />
          </div>
        </form>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleOpenChange = (newOpen: boolean) => {
    // If closing the dialog and it's a welcome dialog, mark as dismissed
    if (!newOpen && isWelcome && open) {
      localStorage.setItem("buurbak-welcome-dismissed", "true");
      if (onComplete) {
        onComplete();
      }
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {currentStepData.title}
            </DialogTitle>
            {isWelcome && (
              <div className="text-sm text-gray-500">{currentStep + 1}/2</div>
            )}
          </div>
          <DialogDescription className="text-gray-600 -mt-4">
            {currentStepData.subtitle}
          </DialogDescription>
          {/* {isWelcome && (
            <Progress value={(currentStep + 1) * 33.33} className="h-2" />
          )} */}
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t("personalInfo.form.updateSuccess")}
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-y-auto max-h-[60vh]">
          {currentStepData.content}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {currentStep === 0 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                {t("personalInfo.incomplete.later")}
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-primary hover:bg-primary/80"
              >
                {t("personalInfo.incomplete.letsStart")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {currentStep === 1 && (
            <>
              {isWelcome && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("personalInfo.form.back")}
                </Button>
              )}
              {!isWelcome && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {t("personalInfo.form.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading || !requiredFieldsFilled}
                className="flex-1 bg-primary hover:bg-primary/80"
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("personalInfo.form.saving")}
                  </>
                ) : isWelcome ? (
                  t("personalInfo.incomplete.completeProfile")
                ) : (
                  t("personalInfo.form.save")
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CompleteProfileDialog;
