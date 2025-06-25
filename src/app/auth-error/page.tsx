"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  useEffect(() => {
    // Get the error type from the URL
    const error = searchParams.get("error");
    
    // Map error codes to friendly messages
    const errorMessages: Record<string, string> = {
      "Signin": "Er is een probleem opgetreden tijdens het inloggen. Probeer het opnieuw.",
      "OAuthSignin": "Er is een probleem opgetreden bij het starten van de sociale login.",
      "OAuthCallback": "Er is een probleem opgetreden bij de terugkeer van de sociale login.",
      "OAuthCreateAccount": "We konden geen account aanmaken met je sociale login.",
      "EmailCreateAccount": "We konden geen account aanmaken met je e-mail.",
      "Callback": "Er is een probleem opgetreden tijdens het authenticatieproces.",
      "OAuthAccountNotLinked": "Deze e-mail is al in gebruik met een andere login methode.",
      "EmailSignin": "Er was een probleem met de e-maillink. Probeer het opnieuw.",
      "CredentialsSignin": "De inloggegevens zijn onjuist. Controleer je e-mail en wachtwoord.",
      "default": "Er is een onverwachte fout opgetreden bij het inloggen."
    };

    // Set the appropriate error message
    setErrorMessage(errorMessages[error || ""] || errorMessages.default);
    
    // Automatically redirect back to login page after 5 seconds
    const redirectTimer = setTimeout(() => {
      router.push("/login");
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [searchParams, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Inloggen mislukt</h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => router.push("/login")}
          >
            Terug naar inloggen
          </Button>
          
          <div className="text-center">
            <Link href="/" className="text-sm text-primary hover:text-primary/80">
              Terug naar de homepage
            </Link>
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-8">
            Je wordt automatisch teruggestuurd naar de inlogpagina over enkele seconden.
          </p>
        </div>
      </div>
    </div>
  );
}