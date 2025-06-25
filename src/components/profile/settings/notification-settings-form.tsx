"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  CreditCard,
  MessageSquare,
  Bell,
  Clock,
  Tag,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

interface User {
  id: string;
  email: string;
  emailNotifications?: boolean;
}

interface NotificationSettingsFormProps {
  user: User;
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: NotificationSetting[];
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function NotificationSettingsForm({
  user,
}: NotificationSettingsFormProps) {
  const { t } = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [masterEmailEnabled, setMasterEmailEnabled] = useState(
    user.emailNotifications ?? true
  );

  // Initialize with default categories and settings
  const getDefaultCategories = (): NotificationCategory[] => [
    {
      id: "bookings",
      title: t('settings.notifications.categories.bookings.title'),
      description: t('settings.notifications.categories.bookings.description'),
      icon: <Calendar className="h-5 w-5" />,
      settings: [
        {
          id: "booking_request",
          label: t('settings.notifications.categories.bookings.settings.booking_request.label'),
          description: t('settings.notifications.categories.bookings.settings.booking_request.description'),
          enabled: true,
        },
        {
          id: "booking_confirmed",
          label: t('settings.notifications.categories.bookings.settings.booking_confirmed.label'),
          description: t('settings.notifications.categories.bookings.settings.booking_confirmed.description'),
          enabled: true,
        },
        {
          id: "booking_cancelled",
          label: t('settings.notifications.categories.bookings.settings.booking_cancelled.label'),
          description: t('settings.notifications.categories.bookings.settings.booking_cancelled.description'),
          enabled: true,
        },
        {
          id: "booking_modified",
          label: t('settings.notifications.categories.bookings.settings.booking_modified.label'),
          description: t('settings.notifications.categories.bookings.settings.booking_modified.description'),
          enabled: true,
        },
      ],
    },
    {
      id: "payments",
      title: t('settings.notifications.categories.payments.title'),
      description: t('settings.notifications.categories.payments.description'),
      icon: <CreditCard className="h-5 w-5" />,
      settings: [
        {
          id: "payment_received",
          label: t('settings.notifications.categories.payments.settings.payment_received.label'),
          description: t('settings.notifications.categories.payments.settings.payment_received.description'),
          enabled: true,
        },
        {
          id: "payout_processed",
          label: t('settings.notifications.categories.payments.settings.payout_processed.label'),
          description: t('settings.notifications.categories.payments.settings.payout_processed.description'),
          enabled: true,
        },
        {
          id: "payment_failed",
          label: t('settings.notifications.categories.payments.settings.payment_failed.label'),
          description: t('settings.notifications.categories.payments.settings.payment_failed.description'),
          enabled: true,
        },
      ],
    },
    {
      id: "messages",
      title: t('settings.notifications.categories.messages.title'),
      description: t('settings.notifications.categories.messages.description'),
      icon: <MessageSquare className="h-5 w-5" />,
      settings: [
        {
          id: "new_message",
          label: t('settings.notifications.categories.messages.settings.new_message.label'),
          description: t('settings.notifications.categories.messages.settings.new_message.description'),
          enabled: true,
        },
        {
          id: "unread_reminder",
          label: t('settings.notifications.categories.messages.settings.unread_reminder.label'),
          description: t('settings.notifications.categories.messages.settings.unread_reminder.description'),
          enabled: false,
        },
      ],
    },
    {
      id: "reminders",
      title: t('settings.notifications.categories.reminders.title'),
      description: t('settings.notifications.categories.reminders.description'),
      icon: <Clock className="h-5 w-5" />,
      settings: [
        {
          id: "pickup_reminder",
          label: t('settings.notifications.categories.reminders.settings.pickup_reminder.label'),
          description: t('settings.notifications.categories.reminders.settings.pickup_reminder.description'),
          enabled: true,
        },
        {
          id: "return_reminder",
          label: t('settings.notifications.categories.reminders.settings.return_reminder.label'),
          description: t('settings.notifications.categories.reminders.settings.return_reminder.description'),
          enabled: true,
        },
        {
          id: "review_reminder",
          label: t('settings.notifications.categories.reminders.settings.review_reminder.label'),
          description: t('settings.notifications.categories.reminders.settings.review_reminder.description'),
          enabled: false,
        },
      ],
    },
    {
      id: "marketing",
      title: t('settings.notifications.categories.marketing.title'),
      description: t('settings.notifications.categories.marketing.description'),
      icon: <Tag className="h-5 w-5" />,
      settings: [
        {
          id: "promotions",
          label: t('settings.notifications.categories.marketing.settings.promotions.label'),
          description: t('settings.notifications.categories.marketing.settings.promotions.description'),
          enabled: false,
        },
        {
          id: "newsletter",
          label: t('settings.notifications.categories.marketing.settings.newsletter.label'),
          description: t('settings.notifications.categories.marketing.settings.newsletter.description'),
          enabled: false,
        },
        {
          id: "new_features",
          label: t('settings.notifications.categories.marketing.settings.new_features.label'),
          description: t('settings.notifications.categories.marketing.settings.new_features.description'),
          enabled: true,
        },
      ],
    },
  ];

  const [notificationSettings, setNotificationSettings] = useState<
    NotificationCategory[]
  >(getDefaultCategories());

  // Store the original settings to detect changes
  const [originalSettings, setOriginalSettings] = useState<{
    emailNotifications: boolean;
    settings: Record<string, boolean>;
  } | null>(null);

  // Fetch current notification settings from the API
  useEffect(() => {
    async function fetchNotificationSettings() {
      try {
        const response = await fetch("/api/user/notification-settings", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch notification settings");
        }

        const data = await response.json();

        // Update master email toggle
        setMasterEmailEnabled(data.emailNotifications);

        // Store original settings for change detection
        setOriginalSettings({
          emailNotifications: data.emailNotifications,
          settings: data.settings || {},
        });

        // Update detailed settings based on the API response
        setNotificationSettings((prev) =>
          prev.map((category) => ({
            ...category,
            settings: category.settings.map((setting) => {
              // Use the setting key format that matches our API
              const settingKey = `${category.id}:${setting.id}`;

              // Get the setting value from the API response
              const isEnabled =
                data.settings && settingKey in data.settings
                  ? data.settings[settingKey]
                  : setting.enabled; // Fall back to default if not found

              return {
                ...setting,
                enabled: isEnabled,
              };
            }),
          }))
        );

        setHasChanges(false);
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        toast.error("Kon notificatie-instellingen niet laden");
        // Still set original settings to prevent false change detection
        setOriginalSettings({
          emailNotifications: masterEmailEnabled,
          settings: {},
        });
      } finally {
        setIsInitializing(false);
      }
    }

    fetchNotificationSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Create a settings map with all individual settings
      const settingsMap: Record<string, boolean> = {};

      // Populate the settings map with all individual settings
      notificationSettings.forEach((category) => {
        category.settings.forEach((setting) => {
          const settingKey = `${category.id}:${setting.id}`;
          settingsMap[settingKey] = setting.enabled;
        });
      });

      // Prepare data for the API
      const apiData = {
        emailNotifications: masterEmailEnabled,
        pushNotifications: true, // Default to true
        settings: settingsMap,
      };

      const response = await fetch("/api/user/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      // Update original settings after successful save
      setOriginalSettings({
        emailNotifications: masterEmailEnabled,
        settings: settingsMap,
      });

      toast.success(t('settings.notifications.saveButton.save'), {
        description: "Je voorkeuren zijn succesvol bijgewerkt.",
        position: "top-center",
        duration: 3000,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = (categoryId: string, settingId: string) => {
    setNotificationSettings((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              settings: category.settings.map((setting) =>
                setting.id === settingId
                  ? { ...setting, enabled: !setting.enabled }
                  : setting
              ),
            }
          : category
      )
    );
  };

  // Track changes after initial load
  useEffect(() => {
    if (!isInitializing && originalSettings) {
      // Check if master email setting changed
      const masterChanged =
        masterEmailEnabled !== originalSettings.emailNotifications;

      // Check if any individual settings changed
      let settingsChanged = false;
      notificationSettings.forEach((category) => {
        category.settings.forEach((setting) => {
          const settingKey = `${category.id}:${setting.id}`;
          const originalValue =
            originalSettings.settings[settingKey] ?? setting.enabled;
          if (setting.enabled !== originalValue) {
            settingsChanged = true;
          }
        });
      });

      setHasChanges(masterChanged || settingsChanged);
    }
  }, [
    notificationSettings,
    masterEmailEnabled,
    isInitializing,
    originalSettings,
  ]);

  return (
    <motion.div
      className="space-y-10 pb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isInitializing ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-sm text-gray-500">{t('settings.notifications.loading')}</p>
        </div>
      ) : (
        <>
          {masterEmailEnabled ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {notificationSettings.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-start justify-between">
                    <div className="flex items-center mb-4 w-full justify-between space-x-3">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {category.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.settings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="space-y-0.5 pr-4">
                          <Label
                            htmlFor={`${category.id}-${setting.id}`}
                            className="text-sm font-normal text-gray-700 cursor-pointer"
                          >
                            {setting.label}
                          </Label>
                          <p className="text-xs text-gray-500">
                            {setting.description}
                          </p>
                        </div>
                        <Switch
                          id={`${category.id}-${setting.id}`}
                          checked={setting.enabled}
                          onCheckedChange={() =>
                            toggleSetting(category.id, setting.id)
                          }
                          className="shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                {t('settings.notifications.emailNotifications.disabled.title')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('settings.notifications.emailNotifications.disabled.description')}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky bottom-4 pt-8 pb-2 mt-8 bg-white/80 backdrop-blur-sm"
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
                {t('settings.notifications.saveButton.saving')}
              </span>
            ) : (
              t('settings.notifications.saveButton.save')
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
