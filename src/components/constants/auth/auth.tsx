"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/stores/auth.store";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n/client";

interface AuthFormProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  isMobile?: boolean;
  errorState?: boolean | string;
  onForgotPassword?: () => void;
}

export function LoginForm({
  onSuccess,
  onError,
  isMobile = false,
  errorState = false,
  onForgotPassword,
}: AuthFormProps) {
  // Use refs for mobile to prevent state updates from causing rerenders
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // For non-mobile, use state as normal
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation("auth");

  // Clear errors when user starts interacting with fields
  const clearErrors = () => {
    if (errorMessage) {
      setErrorMessage("");
      if (onError) onError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Get values either from refs (mobile) or state (desktop)
    const emailValue = isMobile ? emailRef.current?.value || "" : email;
    const passwordValue = isMobile
      ? passwordRef.current?.value || ""
      : password;

    try {
      await login(emailValue, passwordValue);

      // Call onSuccess callback if provided, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      // Handle specific error cases based on the error message or status code
      let errorKey = "login.errors.general";

      if (error.message === "Invalid credentials") {
        errorKey = "login.errors.invalidCredentials";
      } else if (error.message === "User not found") {
        errorKey = "login.errors.userNotFound";
      } else if (
        error.message?.includes("not verified") ||
        error.message?.includes("verification")
      ) {
        errorKey = "login.errors.notVerified";
      } else if (
        error.message?.includes("disabled") ||
        error.message?.includes("deactivated") ||
        error.message === "Account disabled"
      ) {
        errorKey = "login.errors.accountDisabled";
      }

      const errorMsg = t(errorKey);
      setErrorMessage(errorMsg);

      // Pass the error message to the parent component if onError exists
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    // Direct users to the NextAuth.js social sign-in page
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
      window.location.origin
    )}`;
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 h-11 border border-gray-300 hover:bg-gray-50"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.1711 8.36788H17.4998V8.33329H9.99984V11.6666H14.7094C14.0223 13.607 12.1761 15 9.99984 15C7.23859 15 4.99984 12.7612 4.99984 10C4.99984 7.23871 7.23859 4.99996 9.99984 4.99996C11.2744 4.99996 12.4344 5.48079 13.3169 6.26621L15.6744 3.90871C14.1886 2.52204 12.1965 1.66663 9.99984 1.66663C5.39776 1.66663 1.6665 5.39788 1.6665 10C1.6665 14.6021 5.39776 18.3333 9.99984 18.3333C14.6019 18.3333 18.3332 14.6021 18.3332 10C18.3332 9.44121 18.2757 8.89538 18.1711 8.36788Z"
              fill="#FFC107"
            />
            <path
              d="M2.62744 6.12125L5.36536 8.12913C6.10619 6.29496 7.90036 4.99996 9.99994 4.99996C11.2745 4.99996 12.4345 5.48079 13.317 6.26621L15.6745 3.90871C14.1887 2.52204 12.1966 1.66663 9.99994 1.66663C6.79911 1.66663 4.02327 3.47454 2.62744 6.12125Z"
              fill="#FF3D00"
            />
            <path
              d="M9.99999 18.3334C12.1534 18.3334 14.1084 17.5096 15.5859 16.17L13.0076 13.9875C12.1441 14.6452 11.0888 15.0001 9.99999 15.0001C7.8341 15.0001 5.99486 13.6209 5.29778 11.6917L2.58261 13.7834C3.96244 16.4917 6.76911 18.3334 9.99999 18.3334Z"
              fill="#4CAF50"
            />
            <path
              d="M18.1712 8.36796H17.5V8.33337H10V11.6667H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.9876L13.0079 13.9867L15.5863 16.1692C15.4046 16.3355 18.3333 14.1667 18.3333 10.0001C18.3333 9.44129 18.2758 8.89546 18.1712 8.36796Z"
              fill="#1976D2"
            />
          </svg>
          <span>{t("login.withGoogle")}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 h-11 border border-gray-300 hover:bg-gray-50"
          onClick={() => handleSocialLogin("apple")}
          disabled={isLoading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.0225 10.5417C14.0092 8.9342 14.7808 7.73545 16.3358 6.87737C15.4583 5.58328 14.1533 4.87328 12.43 4.77245C10.8 4.67495 9.04917 5.7592 8.39333 5.7592C7.7025 5.7592 6.1775 4.8142 4.87583 4.8142C2.70167 4.84587 0.4 6.54078 0.4 9.9917C0.4 11.1246 0.610833 12.2979 1.0325 13.5104C1.59917 15.1183 3.3725 18.9508 5.22667 18.8892C6.21333 18.8629 6.90583 18.1604 8.17833 18.1604C9.4175 18.1604 10.0575 18.8892 11.1483 18.8892C13.0258 18.8579 14.6287 15.3642 15.1675 13.7517C12.615 12.4354 12.0225 10.5867 12.0225 10.5458L14.0225 10.5417ZM11.5917 3.0592C12.93 1.4979 12.7917 0.075 12.7667 0C11.6008 0.0704167 10.2483 0.80125 9.47583 1.71875C8.62583 2.68875 8.1625 3.83875 8.26417 5.0375C9.51667 5.14083 10.7125 4.3825 11.5917 3.0592Z"
              fill="black"
            />
          </svg>
          <span>{t("login.withApple")}</span>
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">{t("login.or")}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("login.email")}</Label>
          {isMobile ? (
            <Input
              id="email"
              className="h-10 shadow-none rounded-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              defaultValue={email}
              ref={emailRef}
              required
              disabled={isLoading}
            />
          ) : (
            <Input
              id="email"
              className="h-10 shadow-none rounded-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              required
              disabled={isLoading}
              autoFocus={false}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">{t("login.password")}</Label>
            {onForgotPassword ? (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary/90 hover:text-orange-800"
              >
                {t("login.forgotPassword")}
              </button>
            ) : (
              <Link
                href="/forgot-password"
                className="text-sm text-primary/90 hover:text-orange-800"
              >
                {t("login.forgotPassword")}
              </Link>
            )}
          </div>
          <div className="relative">
            {isMobile ? (
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
                defaultValue={password}
                ref={passwordRef}
                required
                disabled={isLoading}
                className="h-10 shadow-none rounded-lg pr-10"
              />
            ) : (
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearErrors();
                }}
                required
                disabled={isLoading}
                className="h-10 shadow-none rounded-lg pr-10"
                autoFocus={false}
              />
            )}
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {errorMessage && (
          <Alert
            variant="destructive"
            className="mb-4 border-red-500 bg-red-50"
          >
            <AlertDescription className="text-red-800 font-medium">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorState && (
          <div className="mb-4 -mt-2">
            <div className="">
              <p className="text-[12.5px] text-red-500">{errorState}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {t("login.loading")}
            </>
          ) : (
            t("login.submit")
          )}
        </Button>

        {/* Only show this link if not in a dialog */}
        {!onSuccess && (
          <div className="text-center text-sm">
            <span className="text-gray-500">{t("login.noAccount")} </span>
            <Link
              href="/register"
              className="text-primary/90 hover:text-orange-800 font-medium"
            >
              {t("login.register")}
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

export function RegisterForm({
  onSuccess,
  onError,
  isMobile = false,
}: AuthFormProps) {
  // Use refs for mobile to prevent state updates from causing rerenders
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // For non-mobile, use state as normal
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useTranslation("auth");

  // Clear errors when user starts interacting with fields
  const clearErrors = () => {
    if (errorMessage) {
      setErrorMessage("");
      if (onError) onError("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear any error messages
    clearErrors();

    // Only update state when not in mobile mode
    if (!isMobile) {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    // Get values either from refs (mobile) or state (desktop)
    const firstName = isMobile
      ? firstNameRef.current?.value || ""
      : formData.firstName;
    const lastName = isMobile
      ? lastNameRef.current?.value || ""
      : formData.lastName;
    const email = isMobile ? emailRef.current?.value || "" : formData.email;
    const password = isMobile
      ? passwordRef.current?.value || ""
      : formData.password;
    const confirmPassword = isMobile
      ? confirmPasswordRef.current?.value || ""
      : formData.confirmPassword;

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage(t("register.errors.passwordsMismatch"));
      setIsLoading(false);
      return;
    }

    // Validate terms agreement
    if (!agreeTerms) {
      setErrorMessage(t("register.errors.termsRequired"));
      setIsLoading(false);
      return;
    }

    try {
      await register(email, password, firstName, lastName);

      setSuccessMessage(t("register.success"));

      // Call onSuccess callback if provided or redirect after a delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/verify-email-sent");
        }
      }, 2000);
    } catch (error: any) {
      // Handle specific error cases for registration
      let errorKey = "register.errors.general";

      if (
        error.message?.includes("already") ||
        error.message?.includes("exists") ||
        error.message?.includes("duplicate")
      ) {
        errorKey = "register.errors.emailExists";
      } else if (
        error.message?.includes("password") &&
        (error.message?.includes("weak") || error.message?.includes("strength"))
      ) {
        errorKey = "register.errors.weakPassword";
      } else if (
        error.message?.includes("invalid") &&
        error.message?.includes("email")
      ) {
        errorKey = "register.errors.invalidEmail";
      }

      const errorMsg = t(errorKey);
      setErrorMessage(errorMsg);

      // Pass the error message to the parent component if onError exists
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    // Direct users to the NextAuth.js social sign-in page
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
      window.location.origin
    )}`;
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <AlertDescription className="text-green-800 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 h-11 border border-gray-300 hover:bg-gray-50"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.1711 8.36788H17.4998V8.33329H9.99984V11.6666H14.7094C14.0223 13.607 12.1761 15 9.99984 15C7.23859 15 4.99984 12.7612 4.99984 10C4.99984 7.23871 7.23859 4.99996 9.99984 4.99996C11.2744 4.99996 12.4344 5.48079 13.3169 6.26621L15.6744 3.90871C14.1886 2.52204 12.1965 1.66663 9.99984 1.66663C5.39776 1.66663 1.6665 5.39788 1.6665 10C1.6665 14.6021 5.39776 18.3333 9.99984 18.3333C14.6019 18.3333 18.3332 14.6021 18.3332 10C18.3332 9.44121 18.2757 8.89538 18.1711 8.36788Z"
              fill="#FFC107"
            />
            <path
              d="M2.62744 6.12125L5.36536 8.12913C6.10619 6.29496 7.90036 4.99996 9.99994 4.99996C11.2745 4.99996 12.4345 5.48079 13.317 6.26621L15.6745 3.90871C14.1887 2.52204 12.1966 1.66663 9.99994 1.66663C6.79911 1.66663 4.02327 3.47454 2.62744 6.12125Z"
              fill="#FF3D00"
            />
            <path
              d="M9.99999 18.3334C12.1534 18.3334 14.1084 17.5096 15.5859 16.17L13.0076 13.9875C12.1441 14.6452 11.0888 15.0001 9.99999 15.0001C7.8341 15.0001 5.99486 13.6209 5.29778 11.6917L2.58261 13.7834C3.96244 16.4917 6.76911 18.3334 9.99999 18.3334Z"
              fill="#4CAF50"
            />
            <path
              d="M18.1712 8.36796H17.5V8.33337H10V11.6667H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.9876L13.0079 13.9867L15.5863 16.1692C15.4046 16.3355 18.3333 14.1667 18.3333 10.0001C18.3333 9.44129 18.2758 8.89546 18.1712 8.36796Z"
              fill="#1976D2"
            />
          </svg>
          <span>{t("register.withGoogle")}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 h-11 border border-gray-300 hover:bg-gray-50"
          onClick={() => handleSocialLogin("apple")}
          disabled={isLoading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.0225 10.5417C14.0092 8.9342 14.7808 7.73545 16.3358 6.87737C15.4583 5.58328 14.1533 4.87328 12.43 4.77245C10.8 4.67495 9.04917 5.7592 8.39333 5.7592C7.7025 5.7592 6.1775 4.8142 4.87583 4.8142C2.70167 4.84587 0.4 6.54078 0.4 9.9917C0.4 11.1246 0.610833 12.2979 1.0325 13.5104C1.59917 15.1183 3.3725 18.9508 5.22667 18.8892C6.21333 18.8629 6.90583 18.1604 8.17833 18.1604C9.4175 18.1604 10.0575 18.8892 11.1483 18.8892C13.0258 18.8579 14.6287 15.3642 15.1675 13.7517C12.615 12.4354 12.0225 10.5867 12.0225 10.5458L14.0225 10.5417ZM11.5917 3.0592C12.93 1.4979 12.7917 0.075 12.7667 0C11.6008 0.0704167 10.2483 0.80125 9.47583 1.71875C8.62583 2.68875 8.1625 3.83875 8.26417 5.0375C9.51667 5.14083 10.7125 4.3825 11.5917 3.0592Z"
              fill="black"
            />
          </svg>
          <span>{t("register.withApple")}</span>
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">
            {t("register.or")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("register.firstName")}</Label>
            {isMobile ? (
              <Input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                className="h-10 shadow-none rounded-lg"
                placeholder={t("register.firstNamePlaceholder")}
                defaultValue={formData.firstName}
                ref={firstNameRef}
                required
                disabled={isLoading}
              />
            ) : (
              <Input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                className="h-10 shadow-none rounded-lg"
                placeholder={t("register.firstNamePlaceholder")}
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoFocus={false}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t("register.lastName")}</Label>
            {isMobile ? (
              <Input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                className="h-10 shadow-none rounded-lg"
                placeholder={t("register.lastNamePlaceholder")}
                defaultValue={formData.lastName}
                ref={lastNameRef}
                required
                disabled={isLoading}
              />
            ) : (
              <Input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                className="h-10 shadow-none rounded-lg"
                placeholder={t("register.lastNamePlaceholder")}
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoFocus={false}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("register.email")}</Label>
          {isMobile ? (
            <Input
              id="email"
              name="email"
              className="h-10 shadow-none rounded-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              defaultValue={formData.email}
              ref={emailRef}
              required
              disabled={isLoading}
            />
          ) : (
            <Input
              id="email"
              name="email"
              className="h-10 shadow-none rounded-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              autoFocus={false}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("register.password")}</Label>
          <div className="relative">
            {isMobile ? (
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("register.passwordPlaceholder")}
                defaultValue={formData.password}
                ref={passwordRef}
                required
                className="h-10 shadow-none rounded-lg pr-10"
                disabled={isLoading}
                minLength={8}
              />
            ) : (
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("register.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                required
                className="h-10 shadow-none rounded-lg pr-10"
                disabled={isLoading}
                minLength={8}
                autoFocus={false}
              />
            )}
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t("register.confirmPassword")}
          </Label>
          {isMobile ? (
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("register.passwordPlaceholder")}
              defaultValue={formData.confirmPassword}
              ref={confirmPasswordRef}
              className="h-10 shadow-none rounded-lg"
              required
              disabled={isLoading}
            />
          ) : (
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("register.passwordPlaceholder")}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="h-10 shadow-none rounded-lg"
              required
              disabled={isLoading}
              autoFocus={false}
            />
          )}
          <p className="text-xs text-gray-500">
            {t("register.passwordRequirements")}
          </p>
        </div>

        <div className="flex items-start space-x-2 mt-3">
          <Checkbox
            id="agreeTerms"
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
            className="data-[state=checked]:bg-primary shadow-none data-[state=checked]:border-primary mt-1"
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="agreeTerms"
              className="text-[13px] mt-1.5 text-gray-700 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("register.agreeTerms")}
            </label>
            <p className="text-xs text-gray-500">
              {t("register.termsAndConditions")}{" "}
              <Link
                href="/terms"
                className="text-primary/90 hover:text-orange-800"
              >
                {t("register.terms")}
              </Link>{" "}
              {t("register.and")}{" "}
              <Link
                href="/privacy"
                className="text-primary/90 hover:text-orange-800"
              >
                {t("register.privacy")}
              </Link>
            </p>
          </div>
        </div>

        {errorMessage && (
          <Alert
            variant="destructive"
            className="mb-4 border-red-500 bg-red-50"
          >
            <AlertDescription className="text-red-800 font-medium">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {t("register.loading")}
            </>
          ) : (
            t("register.submit")
          )}
        </Button>

        {/* Only show this link if not in a dialog */}
        {!onSuccess && (
          <div className="text-center text-sm">
            <span className="text-gray-500">{t("register.hasAccount")} </span>
            <Link
              href="/login"
              className="text-primary/90 hover:text-orange-800 font-medium"
            >
              {t("register.login")}
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

export function ForgotPasswordForm({
  onSuccess,
  isMobile = false,
}: AuthFormProps) {
  // Use ref for mobile
  const emailRef = useRef<HTMLInputElement>(null);

  // For non-mobile, use state
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { t } = useTranslation("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    // Get email value based on mobile or desktop
    const emailValue = isMobile ? emailRef.current?.value || "" : email;

    try {
      await requestPasswordReset(emailValue);
      setSuccessMessage(t("forgotPassword.success"));

      if (!isMobile) {
        setEmail(""); // Clear form after success on desktop
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error: any) {
      // Always show a generic message for security purposes
      // This prevents user enumeration by revealing if an email exists
      setSuccessMessage(t("forgotPassword.success"));

      // Only log the error, don't display it to user
      console.error("Password reset error:", error);

      // Still trigger onSuccess to avoid revealing if email exists
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!onSuccess && (
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-bold">{t("forgotPassword.title")}</h1>
          <p className="text-gray-500 text-sm">
            {t("forgotPassword.subtitle")}
          </p>
        </div>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-4 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800 font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <AlertDescription className="text-green-800 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("forgotPassword.email")}</Label>
          {isMobile ? (
            <Input
              id="email"
              className="h-10 shadow-none rounded-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              ref={emailRef}
              required
              disabled={isLoading || !!successMessage}
            />
          ) : (
            <Input
              id="email"
              className="h-10 shadow-none rounded-lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || !!successMessage}
              autoFocus={false}
            />
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {t("forgotPassword.loading")}
            </>
          ) : (
            t("forgotPassword.submit")
          )}
        </Button>

        {!onSuccess && (
          <div className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary/90 hover:text-orange-800 font-medium"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

// Continuing ResetPasswordForm component
export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { t } = useTranslation("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setErrorMessage(t("resetPassword.errors.passwordsMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setSuccessMessage(t("resetPassword.success"));

      // Redirect after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      // Handle specific error cases for password reset
      let errorKey = "resetPassword.errors.general";

      if (
        error.message?.includes("token") &&
        (error.message?.includes("expired") ||
          error.message?.includes("invalid"))
      ) {
        errorKey = "resetPassword.errors.invalidToken";
      } else if (
        error.message?.includes("password") &&
        (error.message?.includes("weak") || error.message?.includes("strength"))
      ) {
        errorKey = "resetPassword.errors.weakPassword";
      } else if (error.message?.includes("same")) {
        errorKey = "resetPassword.errors.samePassword";
      }

      setErrorMessage(t(errorKey));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("resetPassword.title")}</h1>
        <p className="text-gray-500">{t("resetPassword.subtitle")}</p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800 font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <AlertDescription className="text-green-800 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("resetPassword.newPassword")}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("resetPassword.passwordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              className="pr-10"
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {t("resetPassword.passwordRequirements")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t("resetPassword.confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder={t("resetPassword.passwordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {t("resetPassword.loading")}
            </>
          ) : (
            t("resetPassword.submit")
          )}
        </Button>
      </form>
    </div>
  );
}

export function VerifyEmailMessage() {
  const { t } = useTranslation("auth");

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 text-center">
      <div className="bg-orange-50 p-6 rounded-lg border border-orange-100">
        <h1 className="text-2xl font-bold text-orange-700 mb-4">
          {t("verifyEmail.checkInbox")}
        </h1>
        <p className="text-gray-700 mb-4">
          {t("verifyEmail.verificationSent")}
        </p>
        <p className="text-gray-600 text-sm">{t("verifyEmail.noEmail")}</p>
      </div>

      <div className="flex justify-center space-x-4">
        <Link href="/login">
          <Button variant="outline">{t("verifyEmail.backToLogin")}</Button>
        </Link>
        <Button className="bg-primary hover:bg-primary/90">
          {t("verifyEmail.resend")}
        </Button>
      </div>
    </div>
  );
}

export function EmailVerificationSuccess() {
  const { t } = useTranslation("auth");

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 text-center">
      <div className="bg-green-50 p-6 rounded-lg border border-green-100">
        <svg
          className="w-16 h-16 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          {t("verificationSuccess.title")}
        </h1>
        <p className="text-gray-700 mb-4">{t("verificationSuccess.message")}</p>
      </div>

      <Link href="/login">
        <Button className="bg-primary hover:bg-primary/90">
          {t("verificationSuccess.goToLogin")}
        </Button>
      </Link>
    </div>
  );
}
