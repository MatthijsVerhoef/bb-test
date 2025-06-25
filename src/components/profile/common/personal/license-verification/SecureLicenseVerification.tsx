// components/profile/common/personal/license-verification/SecureLicenseVerification.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Upload,
  AlertCircle,
  Info,
  X,
  Clock,
  Lock,
  CheckSquare,
  User,
  Calendar,
  Flag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";

// Types for license verification
interface VerificationStatus {
  verified: boolean;
  verificationId?: string;
  categories?: string[];
  country?: string;
  expiryDate?: string;
  verificationDate?: string;
}

interface LicenseVerificationProps {
  userId: string;
  userName?: string;
  onVerificationComplete?: (status: VerificationStatus) => void;
}

// Countries for license issuer dropdown
const COUNTRIES = [
  { code: "NL" },
  { code: "DE" },
  { code: "BE" },
  { code: "FR" },
  { code: "ES" },
  { code: "IT" },
  { code: "GB" },
  { code: "AT" },
  { code: "CH" },
  { code: "DK" },
  { code: "SE" },
  { code: "NO" },
  { code: "PL" },
];

// License categories
const LICENSE_CATEGORIES = [
  { id: "AM", label: "AM" },
  { id: "A1", label: "A1" },
  { id: "A2", label: "A2" },
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "BE", label: "BE" },
  { id: "C1", label: "C1" },
  { id: "C", label: "C" },
  { id: "CE", label: "CE" },
  { id: "D1", label: "D1" },
  { id: "D", label: "D" },
  { id: "T", label: "T" },
];

export default function SecureLicenseVerification({
  userId,
  userName,
  onVerificationComplete,
}: LicenseVerificationProps) {
  // Initialize translations
  const { t } = useTranslation('profile');
  
  // State for dialog and verification process
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCountry, setLicenseCountry] = useState("NL");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, boolean>
  >({
    B: false,
    BE: false,
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [licenseError, setLicenseError] = useState("");

  // Fetch verification status on component mount
  useEffect(() => {
    // Check for existing verification status in session storage
    // This helps prevent repeated toast notifications for the same verification
    const storedVerification = sessionStorage.getItem(
      "license_verification_status"
    );

    if (storedVerification) {
      try {
        const parsedStatus = JSON.parse(storedVerification);
        setVerificationStatus(parsedStatus);
        setIsLoading(false);

        // Still pass to parent component if needed, but silently (no toast)
        if (onVerificationComplete) {
          onVerificationComplete(parsedStatus);
        }
        return; // Skip fetching if we have stored data
      } catch (e) {
        // If parsing fails, continue with fetch
        console.error("Error parsing stored verification status", e);
      }
    }

    const fetchVerificationStatus = async () => {
      setIsLoading(true);
      try {
        // Add cache busting to avoid getting stale data
        const url = `/api/auth/license-verification?_cb=${Date.now()}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setVerificationStatus(data);

          // Store in session storage to prevent repeated fetches
          sessionStorage.setItem(
            "license_verification_status",
            JSON.stringify(data)
          );

          // Pass the verification status to parent component if callback exists
          // But don't show toast as this is just initial data loading
          if (onVerificationComplete) {
            onVerificationComplete(data);
          }
        } else {
          // If no license verification found, set verified to false
          setVerificationStatus({ verified: false });
          sessionStorage.removeItem("license_verification_status");
        }
      } catch (error) {
        console.error("Failed to fetch verification status:", error);
        setVerificationStatus({ verified: false });
        sessionStorage.removeItem("license_verification_status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [userId, onVerificationComplete]);

  // Handle dialog open/close
  const openDialog = () => {
    setStep(1);
    setProgress(25);
    setIsDialogOpen(true);
    setLicenseError("");

    // If we're editing an existing license, pre-fill the form with current values
    if (verificationStatus?.verified) {
      // We can't pre-fill the license number since we only have the hash
      setLicenseNumber("");

      // Pre-fill country if available
      setLicenseCountry(verificationStatus.country || "NL");

      // Pre-fill expiry date if available
      if (verificationStatus.expiryDate) {
        // Format date as YYYY-MM-DD for input field
        const date = new Date(verificationStatus.expiryDate);
        const formattedDate = date.toISOString().split("T")[0];
        setExpiryDate(formattedDate);
      } else {
        setExpiryDate("");
      }

      // Pre-fill selected categories if available
      if (
        verificationStatus.categories &&
        verificationStatus.categories.length > 0
      ) {
        const categoriesObj: Record<string, boolean> = {};
        LICENSE_CATEGORIES.forEach((cat) => {
          categoriesObj[cat.id] =
            verificationStatus.categories?.includes(cat.id) || false;
        });
        setSelectedCategories(categoriesObj);
      } else {
        setSelectedCategories({ B: false, BE: false });
      }
    } else {
      // Reset form for new verification
      setLicenseNumber("");
      setLicenseCountry("NL");
      setExpiryDate("");
      setSelectedCategories({ B: false, BE: false });
    }

    setAcceptTerms(false);
  };

  // Handle license number validation
  const validateLicenseNumber = (number: string) => {
    // Dutch license validation (example)
    if (licenseCountry === "NL") {
      // Format: 5 numbers followed by 1 or 2 letters and 2 numbers
      const nlPattern = /^\d{5}[A-Z]{1,2}\d{2}$/;
      return nlPattern.test(number);
    }

    // Simple validation for other countries - just require min 6 characters
    return number.length >= 6;
  };

  // Next step in verification process
  const handleNextStep = () => {
    if (step === 1) {
      // Validate license number
      if (!licenseNumber.trim()) {
        setLicenseError(t('licenseVerification.dialog.licenseNumberRequired'));
        return;
      }

      if (!validateLicenseNumber(licenseNumber)) {
        setLicenseError(t('licenseVerification.dialog.licenseNumberInvalid'));
        return;
      }

      setLicenseError("");
    }

    if (step === 3 && !acceptTerms) {
      toast.error(t('licenseVerification.dialog.termsRequired'));
      return;
    }

    const newStep = step + 1;
    setStep(newStep);

    // Update progress
    setProgress(newStep * 25);
  };

  // Toggle license category
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Submit verification
  const handleSubmitVerification = async () => {
    if (!acceptTerms) {
      toast.error(t('licenseVerification.dialog.termsRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare categories array
      const categories = Object.entries(selectedCategories)
        .filter(([_, selected]) => selected)
        .map(([category]) => category);

      // Send verification data to the API
      const response = await fetch("/api/auth/license-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          licenseNumber,
          licenseCategories: categories,
          expiryDate,
          licenseCountry,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify license");
      }

      const data = await response.json();

      // Create the verification status object
      const verificationResult: VerificationStatus = {
        verified: true,
        verificationId: data.verificationId,
        categories,
        country: licenseCountry,
        expiryDate,
        verificationDate: new Date().toISOString(),
      };

      // Update local state
      setVerificationStatus(verificationResult);

      // Store in session storage to prevent repeated toasts on page refresh
      sessionStorage.setItem(
        "license_verification_status",
        JSON.stringify(verificationResult)
      );

      // Track that we just verified to prevent duplicate toasts
      sessionStorage.setItem("license_just_verified", "true");

      // Notify parent component
      if (onVerificationComplete) {
        onVerificationComplete(verificationResult);
      }

      // Different message depending on whether this is a new verification or an update
      if (verificationStatus?.verified) {
        toast.success(t('licenseVerification.dialog.success.update'));
      } else {
        toast.success(t('licenseVerification.dialog.success.new'));
      }

      setIsDialogOpen(false);

      // Clear the "just verified" flag after a short delay
      setTimeout(() => {
        sessionStorage.removeItem("license_just_verified");
      }, 5000);
    } catch (error) {
      console.error("Verification failed:", error);
      const errorMessage = error instanceof Error ? error.message : t('licenseVerification.dialog.error');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render verification status card
  if (isLoading) {
    return (
      <Card className="p-0 border-0 border-b pb-5 rounded-none">
        <CardHeader className="py-2 px-0">
          <CardTitle className="font-medium">{t('licenseVerification.title')}</CardTitle>
          <CardDescription className="text-dark mt-1">
            {t('licenseVerification.subtitle.unverified')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 px-0">
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // When verification status is fetched
  return (
    <>
      <Card className="p-0 border-0 border-b pb-5 rounded-none">
        <CardHeader className="py-2 px-0">
          <CardTitle className="font-medium">{t('licenseVerification.title')}</CardTitle>
          <CardDescription className="text-dark mt-1">
            {verificationStatus?.verified
              ? t('licenseVerification.subtitle.verified')
              : t('licenseVerification.subtitle.unverified')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 px-0">
          {verificationStatus?.verified ? (
            <div className="space-y-2">
              <div className="bg-[#F7F7F7] p-4 rounded-lg flex items-center">
                <CheckCircle className="size-4 mr-2 flex-shrink-0" />
                <p className="font-medium text-sm">{t('licenseVerification.verified')}</p>
                <p className="text-sm ms-auto">
                  {t('licenseVerification.verificationId')} {verificationStatus.verificationId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#F7F7F7] rounded-lg py-3.5 px-4">
                  <p className="text-xs text-muted-foreground">{t('licenseVerification.categories')}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {verificationStatus.categories?.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="bg-[#222222] text-white border-0 rounded-sm"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F7F7F7] rounded-lg py-3.5 px-4">
                  <p className="text-xs text-muted-foreground">{t('licenseVerification.expiryDate')}</p>
                  <p className="font-medium text-sm mt-1">
                    {verificationStatus.expiryDate
                      ? new Date(
                          verificationStatus.expiryDate
                        ).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : t('licenseVerification.unknown')}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={openDialog}
              >
                {t('licenseVerification.edit')}
              </Button>

              <div className="text-xs text-muted-foreground mt-0 flex items-center justify-between">
                <div className="flex items-center justify-start text-sm text-muted-foreground mt-4">
                  <Info className="h-4 w-4 mr-2" />
                  <span>
                    {t('licenseVerification.verifiedOn')}{" "}
                    {verificationStatus.verificationDate
                      ? new Date(
                          verificationStatus.verificationDate
                        ).toLocaleDateString("nl-NL")
                      : t('licenseVerification.unknown')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert
                variant="warning"
                className="bg-amber-50 text-amber-800 border-amber-200"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('licenseVerification.unverified.title')}</AlertTitle>
                <AlertDescription>
                  {t('licenseVerification.unverified.description')}
                </AlertDescription>
              </Alert>

              <Button variant="outline" className="w-full" onClick={openDialog}>
                {t('licenseVerification.unverified.button')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {verificationStatus?.verified
                ? t('licenseVerification.dialog.title.edit')
                : t('licenseVerification.dialog.title.new')}
            </DialogTitle>
            <DialogDescription>
              {step === 1 &&
                (verificationStatus?.verified
                  ? t('licenseVerification.dialog.step1.edit')
                  : t('licenseVerification.dialog.step1.new'))}
              {step === 2 && t('licenseVerification.dialog.step2')}
              {step === 3 && t('licenseVerification.dialog.step3')}
              {step === 4 && t('licenseVerification.dialog.step4')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="license-number">{t('licenseVerification.dialog.licenseNumber')}</Label>
                  <Input
                    id="license-number"
                    placeholder={t('licenseVerification.dialog.licenseNumberPlaceholder')}
                    value={licenseNumber}
                    onChange={(e) =>
                      setLicenseNumber(e.target.value.toUpperCase())
                    }
                    className={`h-11 shadow-none rounded-lg mt-2 ${
                      licenseError ? "border-red-500" : ""
                    }`}
                  />
                  {licenseError && (
                    <p className="text-red-500 text-xs mt-1">{licenseError}</p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    <Lock className="h-3 w-3 inline mr-1" />
                    {t('licenseVerification.dialog.licenseNumberSecurity')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license-country">{t('licenseVerification.dialog.country')}</Label>
                  <Select
                    value={licenseCountry}
                    onValueChange={setLicenseCountry}
                  >
                    <SelectTrigger className="w-full h-11 rounded-lg min-h-11">
                      <SelectValue placeholder={t('licenseVerification.dialog.countrySelect')} />
                    </SelectTrigger>
                    <SelectContent className="z-99">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {t(`licenseVerification.countries.${country.code}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry-date">{t('licenseVerification.dialog.expiryDate')}</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    className="h-11 shadow-none rounded-lg mt-2"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 -mt-2">
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {LICENSE_CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className={`rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedCategories[category.id]
                          ? "bg-[#222222] text-white"
                          : "hover:bg-muted/50 bg-[#f7f7f7]"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`font-medium w-7 h-7 rounded-lg flex items-center justify-center mr-2 text-xs ${
                              selectedCategories[category.id]
                                ? "bg-primary/10 text-primary"
                                : "bg-white text-dark"
                            }`}
                          >
                            {category.label}
                          </div>
                          <span className="text-sm font-medium">
                            {t(`licenseVerification.categories.${category.id}.description`)}
                          </span>
                        </div>

                        {selectedCategories[category.id] && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-[#F7F7F7] p-5 rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">
                    {t('licenseVerification.dialog.verificationMechanism')}
                  </h4>
                  <p className="text-[13px] mb-3">
                    {t('licenseVerification.dialog.verificationDescription')}
                  </p>

                  <div className="space-y-4 mt-5 text-sm">
                    <div className="flex items-start">
                      <Lock className="h-3.5 w-3.5 mr-2 mt-0.5" />
                      <span>{t('licenseVerification.dialog.encryptedHash')}</span>
                    </div>
                    <div className="flex items-start">
                      <Flag className="h-3.5 w-3.5 mr-2 mt-0.5" />
                      <span>
                        {t('licenseVerification.dialog.countryOfIssue')}{" "}
                        <span className="font-medium">
                          {t(`licenseVerification.countries.${licenseCountry}`)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="h-3.5 w-3.5 mr-2 mt-0.5" />
                      <span>
                        {t('licenseVerification.dialog.expiryDateLabel')}{" "}
                        <span className="font-medium">
                          {expiryDate
                            ? new Date(expiryDate).toLocaleDateString("nl-NL")
                            : t('licenseVerification.dialog.notFilled')}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <User className="h-3.5 w-3.5 mr-2 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        <span>{t('licenseVerification.dialog.categoriesLabel')} </span>
                        {Object.entries(selectedCategories)
                          .filter(([_, selected]) => selected)
                          .map(([category]) => (
                            <Badge
                              key={category}
                              variant="outline"
                              className="bg-[#222222] text-white border-0 rounded-sm"
                            >
                              {category}
                            </Badge>
                          ))}
                        {Object.values(selectedCategories).every((v) => !v) && (
                          <span className="text-muted-foreground text-xs">
                            {t('licenseVerification.dialog.noCategories')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    className="shadow-none"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      setAcceptTerms(checked === true)
                    }
                  />
                  <div className="grid gap-1.5 leading-none -mt-0.5">
                    <Label
                      htmlFor="terms"
                      className="text-[13px] font-normal leading-snug"
                    >
                      {t('licenseVerification.dialog.termsAgreement')}
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CheckCircle className="absolute -bottom-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
                  </div>
                </div>

                <div className="text-center space-y-2 mt-2">
                  <h3 className="font-medium text-lg">
                    {t('licenseVerification.dialog.processingTitle')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t('licenseVerification.dialog.processingDescription')}
                  </p>
                </div>

                <div className="flex justify-center mt-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {step < 4 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('licenseVerification.dialog.cancel')}
                </Button>

                {step < 3 ? (
                  <Button onClick={handleNextStep}>{t('licenseVerification.dialog.next')}</Button>
                ) : (
                  <Button
                    onClick={handleSubmitVerification}
                    disabled={!acceptTerms || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        {t('licenseVerification.dialog.processing')}
                      </>
                    ) : (
                      verificationStatus?.verified 
                        ? t('licenseVerification.dialog.update')
                        : t('licenseVerification.dialog.verify')
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
