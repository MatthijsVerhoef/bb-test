"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  // Effect to check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Simplified body scroll handling without viewport manipulation
  useEffect(() => {
    if (isMobile && isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Create a style element to prevent scrolling without changing layout
      const style = document.createElement("style");
      style.textContent = `
        body {
          overflow: hidden !important;
          position: relative !important;
          height: 100% !important;
        }
      `;
      style.id = "auth-dialog-scroll-lock";
      document.head.appendChild(style);

      // Add padding to compensate for scrollbar if needed
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        // Remove the style element
        const styleElement = document.getElementById("auth-dialog-scroll-lock");
        if (styleElement) {
          document.head.removeChild(styleElement);
        }

        // Remove padding
        document.body.style.paddingRight = "";

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobile, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSuccess = () => {
    setErrorState(null);
    onClose();

    if (window.location.pathname?.includes("/verhuren")) {
      window.location.href = "/plaatsen";
    } else if (
      window.location.pathname?.includes("/login") ||
      window.location.pathname?.includes("/register")
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
        className="fixed inset-0 z-[99] flex flex-col justify-end"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div
          className="bg-white rounded-t-xl w-full overflow-hidden"
          style={{ maxHeight: "92vh" }}
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
            style={{
              height: "calc(92vh - 60px)",
              maxHeight: "80vh",
              WebkitOverflowScrolling: "touch",
            }}
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
