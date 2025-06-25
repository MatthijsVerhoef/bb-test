"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Laptop,
  Monitor,
  ChevronRight,
  SmartphoneIcon,
  Bell,
  MonitorSmartphone,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

interface User {
  id: string;
  email: string;
}

interface SecuritySettingsFormProps {
  user: User;
}

interface Device {
  id: string;
  name: string;
  type: "mobile" | "tablet" | "desktop";
  browser: string;
  lastActive: Date;
  location: string;
  isCurrent: boolean;
}

interface LoginActivity {
  id: string;
  date: Date;
  location: string;
  device: string;
  successful: boolean;
}

export function SecuritySettingsForm({ user }: SecuritySettingsFormProps) {
  const { t } = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  // Mock data - replace with API calls
  const [devices] = useState<Device[]>([
    {
      id: "1",
      name: "Chrome op MacBook Pro",
      type: "desktop",
      browser: "Chrome 120",
      lastActive: new Date(),
      location: "Amsterdam, Nederland",
      isCurrent: true,
    },
    {
      id: "2",
      name: "Safari op iPhone",
      type: "mobile",
      browser: "Safari 17",
      lastActive: new Date(Date.now() - 86400000),
      location: "Utrecht, Nederland",
      isCurrent: false,
    },
  ]);

  const [recentActivity] = useState<LoginActivity[]>([
    {
      id: "1",
      date: new Date(),
      location: "Amsterdam, Nederland",
      device: "Chrome op MacBook Pro",
      successful: true,
    },
    {
      id: "2",
      date: new Date(Date.now() - 86400000),
      location: "Utrecht, Nederland",
      device: "Safari op iPhone",
      successful: true,
    },
  ]);

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      // TODO: Implement API call to revoke device
      toast.success("Apparaat succesvol verwijderd");
      setSelectedDevice(null);
    } catch (error) {
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
    }
  };

  const handleToggleTwoFactor = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement 2FA setup/disable flow
      if (!twoFactorEnabled) {
        toast.success(t('settings.security.twoFactor.title') + " " + "ingeschakeld");
      } else {
        toast.success(t('settings.security.twoFactor.title') + " " + "uitgeschakeld");
      }
      setTwoFactorEnabled(!twoFactorEnabled);
    } catch (error) {
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (type: Device["type"]) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-4 w-4 text-gray-400" />;
      case "tablet":
        return <Laptop className="h-4 w-4 text-gray-400" />;
      case "desktop":
        return <Monitor className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min geleden`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}u geleden`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d geleden`;
    }
  };

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <div>
          <SmartphoneIcon className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">
            {t('settings.security.twoFactor.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.security.twoFactor.description')}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="2fa" className="text-sm font-medium text-gray-700">
              {t('settings.security.twoFactor.authApp.label')}
            </Label>
            <p className="text-xs text-gray-500">
              {t('settings.security.twoFactor.authApp.description')}
            </p>
          </div>
          <Switch
            id="2fa"
            checked={twoFactorEnabled}
            onCheckedChange={handleToggleTwoFactor}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Login Alerts */}
      <div className="space-y-4">
        <div>
          <Bell className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">{t('settings.security.loginAlerts.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.security.loginAlerts.description')}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="login-alerts"
              className="text-sm font-medium text-gray-700"
            >
              {t('settings.security.loginAlerts.newLogin.label')}
            </Label>
            <p className="text-xs text-gray-500">
              {t('settings.security.loginAlerts.newLogin.description')}
            </p>
          </div>
          <Switch
            id="login-alerts"
            checked={loginAlerts}
            onCheckedChange={setLoginAlerts}
          />
        </div>
      </div>

      {/* Active Devices */}
      <div className="space-y-4">
        <div>
          <MonitorSmartphone className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">{t('settings.security.devices.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.security.devices.description', { count: devices.length })}
          </p>
        </div>

        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    {device.name}
                    {device.isCurrent && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({t('settings.security.devices.current')})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {device.location} • {formatDate(device.lastActive)}
                  </p>
                </div>
              </div>
              {!device.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDevice(device.id)}
                  className="text-gray-500 hover:text-gray-700 -mr-2"
                >
                  {t('settings.security.devices.removeButton')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revoke Device Dialog */}
      <AlertDialog
        open={!!selectedDevice}
        onOpenChange={() => setSelectedDevice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.security.devices.removeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.security.devices.removeDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('settings.security.devices.removeDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedDevice && handleRevokeDevice(selectedDevice)
              }
            >
              {t('settings.security.devices.removeDialog.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
