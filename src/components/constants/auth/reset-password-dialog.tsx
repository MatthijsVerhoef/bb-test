"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ResetPasswordForm } from "@/components/constants/auth/auth";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resetToken: string;
}

export default function ResetPasswordDialog({
  isOpen,
  onClose,
  resetToken,
}: ResetPasswordDialogProps) {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyToken() {
      if (!resetToken) {
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/reset-password/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: resetToken }),
        });

        const data = await response.json();

        if (data.isValid) {
          setIsValidToken(true);
          if (data.email) {
            setMaskedEmail(data.email);
          }
        } else {
          setIsValidToken(false);
          setError(data.error || "De token is ongeldig of verlopen.");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        setIsValidToken(false);
        setError("Er is een fout opgetreden bij het verifiëren van de token.");
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen && resetToken) {
      verifyToken();
    }
  }, [resetToken, isOpen]);

  // Content to display when token is invalid
  const InvalidTokenContent = () => (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">Ongeldige link</h2>
      <p className="text-gray-600 mb-6">
        {error ||
          "De link die je hebt gebruikt is ongeldig of verlopen. Vraag een nieuwe link aan om je wachtwoord te resetten."}
      </p>
      <div className="flex justify-center">
        <Link href="/login">
          <Button className="bg-primary hover:bg-primary/90">
            Ga naar inloggen
          </Button>
        </Link>
      </div>
    </div>
  );

  // Content to display during loading
  const LoadingContent = () => (
    <div className="p-4 flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-gray-600">Token wordt geverifieerd...</p>
    </div>
  );

  // Content to display when token is valid
  const ResetPasswordContent = () => (
    <div className="p-2">
      {maskedEmail && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Reset wachtwoord voor{" "}
            <span className="font-medium">{maskedEmail}</span>
          </p>
        </div>
      )}
      <ResetPasswordForm
        token={resetToken}
        onSuccess={() => {
          // Close dialog after a successful reset (with a delay to show success message)
          setTimeout(() => {
            onClose();
          }, 3000);
        }}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-xl overflow-hidden px-5 py-7">
        <DialogTitle className="hidden"></DialogTitle>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full w-fit absolute top-0 right-0 z-2 mt-2.5 mr-2.5 p-1 opacity-70 bg-gray-100 transition-colors hover:bg-gray-200 focus:outline-none"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Sluiten</span>
        </button>

        <div className="min-h-[300px] flex items-center justify-center">
          {isLoading ? (
            <LoadingContent />
          ) : isValidToken ? (
            <ResetPasswordContent />
          ) : (
            <InvalidTokenContent />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
