"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SettingsDialog } from "./settings-dialog";
import { useTranslation } from "@/lib/i18n/client";

interface SettingsButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SettingsButton({
  variant = "outline",
  size = "icon",
  className = "",
}: SettingsButtonProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation('profile');

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowSettings(true)}
        className={className}
        aria-label={t('settings.dialog.title')}
      >
        <Settings strokeWidth={1.5} className="min-h-5.5 min-w-5.5" />
      </Button>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
