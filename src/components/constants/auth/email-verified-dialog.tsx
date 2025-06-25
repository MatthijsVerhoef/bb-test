"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function EmailVerificationModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      setIsOpen(true);
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setVerificationStatus("loading");

    try {
      const response = await fetch(`/api/auth/verify?token=${token}`, {
        method: "GET",
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus("success");
        // Optional: Remove token from URL
        router.replace("/", { scroll: false });
      } else {
        setVerificationStatus("error");
        setErrorMessage(data.error || "Verificatie mislukt");
      }
    } catch (error) {
      setVerificationStatus("error");
      setErrorMessage("Er is een fout opgetreden. Probeer het opnieuw.");
      console.error("Verification error:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    router.replace("/", { scroll: false });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-8 rounded-xl border-none">
        <DialogHeader>
          <DialogTitle>E-mail Verificatie</DialogTitle>
          <DialogDescription>
            {verificationStatus === "loading" && "Bezig met verificatie..."}
            {verificationStatus === "success" &&
              "Je e-mail is succesvol geverifieerd!"}
            {verificationStatus === "error" && "Verificatie mislukt"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {verificationStatus === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}

          {verificationStatus === "success" && (
            <>
              <CheckCircle
                className="h-10 w-10 text-green-500"
                strokeWidth={1.6}
              />
              <p className="text-center text-black">
                Je kunt nu inloggen met je geverifieerde account.
              </p>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-center text-red-700">{errorMessage}</p>
            </>
          )}

          <Button
            onClick={handleClose}
            className="w-full bg-primary hover:bg-primary/90 border-none hover:border-none outline-none cursor-pointer"
          >
            {verificationStatus === "success" ? "Ga naar inloggen" : "Sluiten"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
