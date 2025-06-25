"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
} from "@/components/constants/auth/auth";
import { X, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
}

export default function AuthDialog({
  isOpen,
  onClose,
  initialView = "login",
}: AuthDialogProps) {
  const { t } = useTranslation("auth");
  const [activeTab, setActiveTab] = useState<string>(initialView);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Effect to check screen size and handle viewport for iOS
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // iOS-specific viewport handling
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // When dialog is open on mobile, handle body scrolling and viewport
    if (isMobile && isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Apply a fixed position to the body to prevent scrolling
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      // iOS-specific viewport handling to prevent jumps
      if (isIOS) {
        // Create a meta tag to control viewport
        const viewportMeta = document.createElement("meta");
        viewportMeta.name = "viewport";
        viewportMeta.content =
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
        viewportMeta.id = "viewport-meta-auth-dialog";

        // Remove any existing viewport meta tags and add the new one
        const existingMeta = document.head.querySelector(
          'meta[name="viewport"]'
        );
        if (existingMeta) {
          document.head.removeChild(existingMeta);
        }
        document.head.appendChild(viewportMeta);
      }

      // Return cleanup function
      return () => {
        // Restore body scrolling when dialog closes
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";

        // Restore scroll position
        window.scrollTo(0, scrollY);

        // Restore original viewport meta tag for iOS
        if (isIOS) {
          const authViewportMeta = document.getElementById(
            "viewport-meta-auth-dialog"
          );
          if (authViewportMeta) {
            document.head.removeChild(authViewportMeta);

            // Restore default viewport
            const defaultViewportMeta = document.createElement("meta");
            defaultViewportMeta.name = "viewport";
            defaultViewportMeta.content = "width=device-width, initial-scale=1";
            document.head.appendChild(defaultViewportMeta);
          }
        }

        // Clean up resize event
        window.removeEventListener("resize", checkScreenSize);
      };
    }

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [isMobile, isOpen]);

  const handleClose = () => {
    onClose();
  };

  // When auth is successful, close the dialog and possibly redirect
  const handleSuccess = () => {
    // Clear any errors when successful
    setErrorState(null);
    onClose();

    // If we're on the verhuren page, redirect to the add trailer form
    if (window.location.pathname.includes("/verhuren")) {
      window.location.href = "/plaatsen";
    }
    // If we're on the login page, redirect to home to avoid showing login again
    else if (
      window.location.pathname.includes("/login") ||
      window.location.pathname.includes("/register")
    ) {
      window.location.href = "/";
    }
  };

  const AuthContent = () => {
    if (showForgotPassword) {
      return (
        <>
          <div className="font-medium text-xl md:text-2xl max-w-[80%] mx-auto text-center mb-4 md:mb-2">
            <span className="text-primary">{t("forgotPassword.title")}</span>
          </div>

          <div className="w-full">
            <div className="sticky top-0 z-10 mb-6">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center text-sm text-gray-600 hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("forgotPassword.backToLogin")}
              </button>
            </div>

            <div className="px-2 overflow-hidden min-h-[350px]">
              <ForgotPasswordForm
                onSuccess={() => {
                  // After success, we can either go back to login or close the dialog
                  setTimeout(() => {
                    setShowForgotPassword(false);
                  }, 3000);
                }}
                isMobile={isMobile}
              />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="font-medium text-xl md:text-2xl max-w-[80%] mx-auto text-center mb-4 md:mb-2">
          <span className="text-primary">{t("dialog.loginTab")}</span>{" "}
          {t("dialog.or")}{" "}
          <span className="text-primary">{t("dialog.registerTab")}</span>{" "}
          {t("dialog.at")} BuurBak
        </div>

        <div className="w-full">
          {/* Tab header */}
          <div className="grid w-full grid-cols-2 rounded-none bg-white sticky top-0 z-10">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorState(null);
              }}
              className={`rounded-none border-b-2 border-l-0 border-r-0 border-t-0 cursor-pointer py-3 text-sm font-medium
                ${
                  activeTab === "login"
                    ? "border-primary"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              {t("dialog.loginTab")}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorState(null);
              }}
              className={`rounded-none border-b-2 border-l-0 border-r-0 border-t-0 cursor-pointer py-3 text-sm font-medium
                ${
                  activeTab === "register"
                    ? "border-primary"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              {t("dialog.registerTab")}
            </button>
          </div>

          {/* Tab content */}
          <div className="px-2 overflow-hidden min-h-[350px] pt-4 mt-5 pb-8">
            <div className={activeTab === "login" ? "block" : "hidden"}>
              <LoginForm
                onSuccess={handleSuccess}
                isMobile={isMobile}
                onError={(error) => setErrorState(error)}
                errorState={errorState}
                onForgotPassword={() => setShowForgotPassword(true)}
              />
            </div>
            <div className={activeTab === "register" ? "block" : "hidden"}>
              <RegisterForm
                onSuccess={handleSuccess}
                isMobile={isMobile}
                onError={(error) => setErrorState(error)}
                errorState={errorState}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  if (isMobile) {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 z-[99] flex flex-col justify-end"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div
          className="bg-white rounded-t-xl w-full max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed position header */}
          <div className="sticky top-0 z-50 bg-white border-b p-4 pb-0 flex justify-between items-center">
            <span className="font-medium text-lg">{t("dialog.account")}</span>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-1.5 bg-gray-100 transition-colors hover:bg-gray-200 focus:outline-none"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t("dialog.close")}</span>
            </button>
          </div>

          <div
            className="overflow-auto"
            style={{ height: "calc(92vh - 60px)", maxHeight: "80vh" }}
          >
            <div className="p-4 pt-6 pb-40">
              <AuthContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] min-h-[73vh] rounded-xl overflow-hidden flex flex-col p-4 md:p-8">
        <DialogTitle className="sr-only">
          {t("dialog.loginRegister")}
        </DialogTitle>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-full p-1 opacity-70 bg-gray-100 transition-colors hover:bg-gray-200 focus:outline-none"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{t("dialog.close")}</span>
        </button>

        <AuthContent />
      </DialogContent>
    </Dialog>
  );
}
