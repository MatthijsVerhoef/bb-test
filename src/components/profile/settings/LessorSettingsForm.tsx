"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Handshake, Info, ListChecks, ShieldX, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  kvkNumber?: string | null;
  vatNumber?: string | null;
}

interface LessorSettingsFormProps {
  user: User;
}

interface LessorSettings {
  autoApproval: {
    enabled: boolean;
    minimumRating: number | null; // Made nullable
    minimumRentals: number;
    verifiedUsersOnly: boolean;
  };
  rentalSettings: {
    minRentalDuration: number;
    maxRentalDuration: number;
    securityDepositPercentage: number;
  };
  cancellationPolicy: string;
  customCancellationText: string;
}

export default function LessorSettingsForm({ user }: LessorSettingsFormProps) {
  const { t } = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] =
    useState<LessorSettings | null>(null);

  // Auto-approval Settings
  const [autoApproval, setAutoApproval] = useState({
    enabled: false,
    minimumRating: null as number | null, // Made nullable with proper typing
    minimumRentals: 3,
    verifiedUsersOnly: true,
  });

  // Default Rental Settings
  const [rentalSettings, setRentalSettings] = useState({
    minRentalDuration: 1,
    maxRentalDuration: 30,
    securityDepositPercentage: 20,
  });

  // Default Cancellation Policy
  const [cancellationPolicy, setCancellationPolicy] = useState("moderate");
  const [customCancellationText, setCustomCancellationText] = useState("");

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/user/lessor-settings");

        if (!response.ok) {
          if (response.status === 403) {
            toast.error("Je hebt geen verhuurderrechten");
            return;
          }
          throw new Error("Failed to fetch settings");
        }

        const data = await response.json();

        // Update all settings
        setAutoApproval(data.autoApproval);
        setRentalSettings(data.rentalSettings);
        setCancellationPolicy(data.cancellationPolicy);
        setCustomCancellationText(data.customCancellationText || "");

        // Store original settings for change detection
        setOriginalSettings(data);
        setHasChanges(false);
      } catch (error) {
        console.error("Error fetching lessor settings:", error);
        toast.error("Kon instellingen niet laden");
      } finally {
        setIsInitializing(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/lessor-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoApproval,
          rentalSettings,
          cancellationPolicy,
          customCancellationText:
            cancellationPolicy === "custom" ? customCancellationText : "",
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      // Update original settings after successful save
      const currentSettings = {
        autoApproval,
        rentalSettings,
        cancellationPolicy,
        customCancellationText,
      };
      setOriginalSettings(currentSettings);

      toast.success("Verhuurdersinstellingen opgeslagen", {
        description: "Je instellingen zijn succesvol bijgewerkt.",
        duration: 3000,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving lessor settings:", error);
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  // Track changes
  useEffect(() => {
    if (!isInitializing && originalSettings) {
      const hasChanged =
        JSON.stringify(autoApproval) !==
          JSON.stringify(originalSettings.autoApproval) ||
        JSON.stringify(rentalSettings) !==
          JSON.stringify(originalSettings.rentalSettings) ||
        cancellationPolicy !== originalSettings.cancellationPolicy ||
        (cancellationPolicy === "custom" &&
          customCancellationText !== originalSettings.customCancellationText);

      setHasChanges(hasChanged);
    }
  }, [
    autoApproval,
    rentalSettings,
    cancellationPolicy,
    customCancellationText,
    isInitializing,
    originalSettings,
  ]);

  const cancellationOptions = [
    {
      value: "flexible",
      label: "Flexibel",
      description: "Gratis annuleren tot 24 uur voor ophalen",
    },
    {
      value: "moderate",
      label: "Gematigd",
      description: "100% terugbetaling bij annulering binnen 72 uur",
    },
    {
      value: "strict",
      label: "Strikt",
      description: "Geen terugbetaling binnen 7 dagen",
    },
  ];

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-500">{t('settings.notifications.loading')}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-10 pb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Auto-approval Settings */}
      <div className="space-y-6">
        <div>
          <ListChecks className="size-5 mb-4" />
          <h3 className=" font-medium text-gray-900 text-sm">
            {t('settings.lessorSettings.autoApproval.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.lessorSettings.autoApproval.description')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approval" className="text-sm font-medium">
                {t('settings.lessorSettings.autoApproval.toggle')}
              </Label>
              <p className="text-xs text-gray-500">
                {t('settings.lessorSettings.autoApproval.toggleDescription')}
              </p>
            </div>
            <Switch
              id="auto-approval"
              checked={autoApproval.enabled}
              className="ms-8"
              onCheckedChange={(checked) =>
                setAutoApproval({ ...autoApproval, enabled: checked })
              }
            />
          </div>

          {autoApproval.enabled && (
            <motion.div
              className="space-y-5 pl-0"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="use-min-rating"
                      className="text-sm font-medium"
                    >
                      {t('settings.lessorSettings.autoApproval.minRating.toggle')}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {t('settings.lessorSettings.autoApproval.minRating.toggleDescription')}
                    </p>
                  </div>
                  <Switch
                    id="use-min-rating"
                    checked={autoApproval.minimumRating !== null}
                    onCheckedChange={(checked) =>
                      setAutoApproval({
                        ...autoApproval,
                        minimumRating: checked ? 4.0 : null,
                      })
                    }
                  />
                </div>

                {autoApproval.minimumRating !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pl-0"
                  >
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="min-rating"
                        className="text-sm font-normal text-gray-700"
                      >
                        {t('settings.lessorSettings.autoApproval.minRating.label')}
                      </Label>
                      <span className="text-sm font-medium text-gray-900">
                        {autoApproval.minimumRating.toFixed(1)} {t('settings.lessorSettings.autoApproval.minRating.star')}
                      </span>
                    </div>
                    <Slider
                      id="min-rating"
                      min={3}
                      max={5}
                      step={0.5}
                      value={[autoApproval.minimumRating]}
                      onValueChange={([value]) =>
                        setAutoApproval({
                          ...autoApproval,
                          minimumRating: value,
                        })
                      }
                      className="mt-2"
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-rentals" className="text-sm font-medium">
                  {t('settings.lessorSettings.autoApproval.minRentals.label')}
                </Label>
                <Select
                  value={autoApproval.minimumRentals.toString()}
                  onValueChange={(value) =>
                    setAutoApproval({
                      ...autoApproval,
                      minimumRentals: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="min-rentals">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('settings.lessorSettings.autoApproval.minRentals.options.none')}</SelectItem>
                    <SelectItem value="1">{t('settings.lessorSettings.autoApproval.minRentals.options.one')}</SelectItem>
                    <SelectItem value="3">{t('settings.lessorSettings.autoApproval.minRentals.options.three')}</SelectItem>
                    <SelectItem value="5">{t('settings.lessorSettings.autoApproval.minRentals.options.five')}</SelectItem>
                    <SelectItem value="10">{t('settings.lessorSettings.autoApproval.minRentals.options.ten')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="verified-only"
                    className="text-sm font-medium"
                  >
                    {t('settings.lessorSettings.autoApproval.verifiedOnly.label')}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {t('settings.lessorSettings.autoApproval.verifiedOnly.description')}
                  </p>
                </div>
                <Switch
                  id="verified-only"
                  checked={autoApproval.verifiedUsersOnly}
                  onCheckedChange={(checked) =>
                    setAutoApproval({
                      ...autoApproval,
                      verifiedUsersOnly: checked,
                    })
                  }
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Rental Settings */}
      <div className="space-y-6">
        <div>
          <Handshake className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">
            {t('settings.lessorSettings.rentalTerms.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.lessorSettings.rentalTerms.description')}
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-duration" className="text-sm font-medium">
                {t('settings.lessorSettings.rentalTerms.minDuration.label')}
              </Label>
              <Select
                value={rentalSettings.minRentalDuration.toString()}
                onValueChange={(value) =>
                  setRentalSettings({
                    ...rentalSettings,
                    minRentalDuration: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="min-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('settings.lessorSettings.rentalTerms.minDuration.options.oneDay')}</SelectItem>
                  <SelectItem value="2">{t('settings.lessorSettings.rentalTerms.minDuration.options.twoDays')}</SelectItem>
                  <SelectItem value="3">{t('settings.lessorSettings.rentalTerms.minDuration.options.threeDays')}</SelectItem>
                  <SelectItem value="7">{t('settings.lessorSettings.rentalTerms.minDuration.options.oneWeek')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-duration" className="text-sm font-medium">
                {t('settings.lessorSettings.rentalTerms.maxDuration.label')}
              </Label>
              <Select
                value={rentalSettings.maxRentalDuration.toString()}
                onValueChange={(value) =>
                  setRentalSettings({
                    ...rentalSettings,
                    maxRentalDuration: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="max-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('settings.lessorSettings.rentalTerms.maxDuration.options.oneWeek')}</SelectItem>
                  <SelectItem value="14">{t('settings.lessorSettings.rentalTerms.maxDuration.options.twoWeeks')}</SelectItem>
                  <SelectItem value="30">{t('settings.lessorSettings.rentalTerms.maxDuration.options.oneMonth')}</SelectItem>
                  <SelectItem value="60">{t('settings.lessorSettings.rentalTerms.maxDuration.options.twoMonths')}</SelectItem>
                  <SelectItem value="90">{t('settings.lessorSettings.rentalTerms.maxDuration.options.threeMonths')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="security-deposit" className="text-sm font-medium">
                {t('settings.lessorSettings.rentalTerms.securityDeposit.label')}
              </Label>
              <span className="text-sm font-medium text-gray-900">
                {rentalSettings.securityDepositPercentage}%
              </span>
            </div>
            <Slider
              id="security-deposit"
              min={0}
              max={50}
              step={5}
              value={[rentalSettings.securityDepositPercentage]}
              onValueChange={([value]) =>
                setRentalSettings({
                  ...rentalSettings,
                  securityDepositPercentage: value,
                })
              }
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('settings.lessorSettings.rentalTerms.securityDeposit.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-6">
        <div>
          <ShieldX className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">
            {t('settings.lessorSettings.cancellationPolicy.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.lessorSettings.cancellationPolicy.description')}
          </p>
        </div>

        <div className="space-y-3">
          {cancellationOptions.map((option) => (
            <label
              key={option.value}
              className={`relative flex rounded-lg border p-4 transition-colors ${
                cancellationPolicy === option.value
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="cancellation-policy"
                value={option.value}
                checked={cancellationPolicy === option.value}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  cancellationPolicy === option.value
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {cancellationPolicy === option.value && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
            </label>
          ))}
        </div>

        {cancellationPolicy === "custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Textarea
              placeholder={t('settings.lessorSettings.cancellationPolicy.policies.custom.placeholder')}
              value={customCancellationText}
              onChange={(e) => setCustomCancellationText(e.target.value)}
              className="mt-3"
              rows={4}
            />
          </motion.div>
        )}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky bottom-4 pt-4 pb-2 mt-8 bg-white/80 backdrop-blur-sm"
        >
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-10 text-sm rounded-lg font-medium"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('settings.lessorSettings.saveButton.saving')}
              </span>
            ) : (
              t('settings.lessorSettings.saveButton.save')
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
