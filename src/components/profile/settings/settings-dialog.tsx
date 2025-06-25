"use client";

import React, { useState } from "react";
import { useAuth } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NotificationSettingsForm } from "./notification-settings-form";
import { SecuritySettingsForm } from "./security-settings-form";
import { BillingSettingsForm } from "./billing-settings-form";
import {
  Bell,
  Shield,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  BookmarkCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSettingsForm } from "./account-settings-form";
import LessorSettingsForm from "./LessorSettingsForm";
import { useTranslation } from "@/lib/i18n/client";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SettingsOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  description?: string;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation("profile");

  if (!user) {
    return null;
  }

  const settingsOptions: SettingsOption[] = [
    {
      id: "account",
      label: t("settings.sections.account"),
      icon: <UserCircle className="size-5" strokeWidth={1.5} />,
      component: <AccountSettingsForm user={user} />,
    },
    {
      id: "owner",
      label: t("settings.sections.lessorSettings"),
      icon: (
        <BookmarkCheck className="min-w-5 min-h-5 size-5" strokeWidth={1.5} />
      ),
      component: <LessorSettingsForm user={user} />,
    },
    {
      id: "notifications",
      label: t("settings.sections.notifications"),
      icon: <Bell className="size-5" strokeWidth={1.5} />,
      component: <NotificationSettingsForm user={user} />,
    },
    {
      id: "security",
      label: t("settings.sections.security"),
      icon: <Shield className="min-w-5 min-h-5 size-5" strokeWidth={1.5} />,
      component: <SecuritySettingsForm user={user} />,
    },
    {
      id: "billing",
      label: t("settings.sections.billing"),
      icon: <CreditCard className="min-w-5 min-h-5 size-5" strokeWidth={1.5} />,
      component: <BillingSettingsForm user={user} />,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      onOpenChange(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const activeOption = settingsOptions.find(
    (option) => option.id === activeSection
  );

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 0 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 0 },
  };

  const pageVariants = {
    enter: {
      x: "100%",
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: "-100%",
      opacity: 0,
    },
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[410px] p-0 flex flex-col items-start justify-start w-full bg-white border-0 max-h-[700px] h-[700px] overflow-hidden rounded-2xl">
        <DialogHeader className="w-full px-8 pt-8 shrink-0">
          {activeSection ? (
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 rounded-full -ml-3"
                onClick={() => setActiveSection(null)}
              >
                <ChevronLeft size={18} />
              </Button>
              <DialogTitle className="flex items-center">
                <span className="text-base font-medium">
                  {activeOption?.label}
                </span>
              </DialogTitle>
            </div>
          ) : (
            <>
              <DialogTitle>{t("settings.dialog.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.dialog.description")}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="pb-4 px-8 relative flex-1 w-full overflow-auto">
          <AnimatePresence mode="wait">
            {activeSection ? (
              // Show the selected section content with animation
              <motion.div
                key={`section-${activeSection}`}
                initial="enter"
                animate="center"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                className="w-full h-full"
              >
                {activeOption?.component}
              </motion.div>
            ) : (
              // Show the list of settings options with animation
              <motion.div
                key="menu"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-2 pt-2 overflow-auto h-full"
              >
                {settingsOptions.map((option) => (
                  <motion.div key={option.id} variants={itemVariants}>
                    <div
                      className="flex items-center justify-between cursor-pointer py-3"
                      onClick={() => setActiveSection(option.id)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">{option.icon}</div>
                        <div>
                          <div className="font-medium text-sm">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}

                <motion.div variants={itemVariants} className="mt-4 p-0">
                  <button
                    className="w-full flex  text-sm hover:cursor-pointer justify-start items-center mb-2 text-destructive hover:text-destructive hover:bg-transparent"
                    onClick={handleLogout}
                    style={{ padding: "0px !important" }}
                  >
                    <LogOut className="size-5 mr-3" strokeWidth={1.5} />
                    <div className="font-medium m-0 p-0 w-fit">
                      {t("settings.logout")}
                    </div>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
