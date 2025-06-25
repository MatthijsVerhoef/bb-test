"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm } from "@/components/constants/auth/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

export default function RegisterPageClient() {
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

  // Benefits are now defined as translation keys
  const benefitKeys = [
    'register.benefits.rentOut',
    'register.benefits.rentNearby',
    'register.benefits.insured',
    'register.benefits.support'
  ];

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
              {t('register.welcomeToBuurBak')}
            </h1>
            <p className="text-gray-600">
              {t('register.createAccount')}
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('register.withBuurBakYouCan')}</h3>
            <ul className="space-y-3">
              {benefitKeys.map((benefitKey, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {t(benefitKey)}
                </li>
              ))}
            </ul>
          </div>

          {/* Register Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <RegisterForm onSuccess={handleSuccess} />
            
            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('register.hasAccount')}{" "}
                <Link 
                  href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                  className="text-primary hover:underline font-medium"
                >
                  {t('register.login')}
                </Link>
              </p>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('register.termsAndConditions')}{" "}
              <Link href="/terms" className="text-primary hover:underline">
                {t('register.terms')}
              </Link>
              {" "}{t('register.and')}{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                {t('register.privacy')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}