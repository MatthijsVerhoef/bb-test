"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/constants/auth/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { t } = useTranslation('auth');

  const handleSuccess = () => {
    // Redirect to return URL or default location
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push('/profiel');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <p className="font-bold text-2xl">
                <span className="text-primary">Buur</span>
                <span className="text-green-700">Bak</span>
              </p>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('login.welcomeBack')}
            </h1>
            <p className="text-gray-600">
              {t('login.signInToContinue')}
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <LoginForm onSuccess={handleSuccess} />
            
            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('login.noAccount')}{" "}
                <Link 
                  href={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                  className="text-primary hover:underline font-medium"
                >
                  {t('login.register')}
                </Link>
              </p>
            </div>
          </div>

          {/* Help links */}
          <div className="mt-8 text-center space-y-2">
            <Link 
              href="/help" 
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              {t('common.needHelp')}
            </Link>
            <Link 
              href="/forgot-password" 
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}