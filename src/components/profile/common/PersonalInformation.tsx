import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, UserCircle, UserRound } from "lucide-react";
import UserLocationMap from "./personal/map";
import {
  useVerification,
  VerificationDialog,
} from "./personal/verification-flow/verification-flow";
import PaymentMethodManager from "./payment/PaymentMethodManager";
import SecureLicenseVerification from "./personal/license-verification/SecureLicenseVerification";
import { useProfileUpdater } from "@/hooks/useProfileUpdater";
import { CompleteProfileDialog } from "../complete-profile-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/lib/i18n/client";

interface PersonalInformationProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    profilePicture: string | null;
    bio: string | null;
    role?: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
    hasValidDriversLicense?: boolean;
    paymentMethods?: {
      defaultMethod?: string;
      stripeConnected?: boolean;
    };
  };
  shouldShowBanner: boolean;
  editProfileInfo?: boolean;
  setEditProfileInfo?: (value: boolean) => void;
}

export default function PersonalInformation({
  user,
  editProfileInfo = false,
  shouldShowBanner,
  setEditProfileInfo,
}: PersonalInformationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const verification = useVerification(user);
  const { t } = useTranslation("profile");

  const { profileData, isUpdating, handleInputChange, handleProfileUpdate } =
    useProfileUpdater({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
      country: user.country || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await handleProfileUpdate(e);

      if (setEditProfileInfo) {
        setEditProfileInfo(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    if (setEditProfileInfo) {
      setEditProfileInfo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl mb-1 font-semibold tracking-tight">
            {t("personalInfo.title")}
          </h2>
          <p className="text-muted-foreground">
            {editProfileInfo
              ? t("personalInfo.updateDetails")
              : t("personalInfo.viewDetails")}
          </p>
          {!editProfileInfo && (
            <div className="flex gap-3 mt-4">
              <Button
                className="border border-black"
                variant={"outline"}
                onClick={() =>
                  setEditProfileInfo && setEditProfileInfo(!editProfileInfo)
                }
              >
                {t("personalInfo.editProfile")}
              </Button>
            </div>
          )}
          {/* Profile Completion Banner - Only show if profile incomplete and user has seen welcome */}
          {shouldShowBanner && (
            <Alert className="mt-4 border-orange-200 flex items-center w-full bg-orange-50">
              <AlertDescription className="flex flex-col md:flex-row w-full items-start md:items-center justify-between">
                <div className="text-primary me-auto">
                  <strong className="font-medium">
                    {t("personalInfo.incomplete.title")}
                  </strong>{" "}
                  {t("personalInfo.incomplete.message")}
                </div>
                <CompleteProfileDialog user={user} isWelcome={false}>
                  <Button
                    size="sm"
                    className="ml-0 mt-4 md:mt-0 md:mls-auto border-primary bg-primary text-white text-[13px]"
                  >
                    <UserRound className="h-4 w-4" />
                    {t("personalInfo.incomplete.button")}
                  </Button>
                </CompleteProfileDialog>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Profile Details Card */}
      <Card className="shadow-none mb-4 p-0 border-0 mt-6 rounded-none pb-0">
        {editProfileInfo && (
          <CardHeader className="p-0 hidden">
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              {editProfileInfo
                ? "Update your personal information and how we can reach you"
                : "Your personal information and contact details"}
            </CardDescription>
          </CardHeader>
        )}

        {editProfileInfo ? (
          <CardContent className="p-0">
            <form
              id="profile-form"
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t("personalInfo.form.firstName")}
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    placeholder={t("personalInfo.form.firstName")}
                    className="rounded-lg h-11 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {t("personalInfo.form.lastName")}
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    placeholder={t("personalInfo.form.lastName")}
                    className="rounded-lg h-11 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("personalInfo.form.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    placeholder="email@gmail.nl"
                    className="rounded-lg h-11 shadow-none"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("personalInfo.form.emailReadonly")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("personalInfo.form.phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="+31 6 12345678"
                    className="rounded-lg h-11 shadow-none"
                  />
                </div>
              </div>

              {/* Hidden field to ensure profile picture gets saved */}
              <input
                type="hidden"
                name="profilePicture"
                value={profileData.profilePicture}
              />
            </form>
          </CardContent>
        ) : (
          /* View Mode */
          <CardContent className="p-0 pb-8 mb-2 border-b">
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center">
                  <UserCircle className="mr-2 size-5.5" strokeWidth={1.5} />
                  <span className="text-[15px] font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>

                <div className="flex items-center">
                  <Mail className="mr-2 size-5.5" strokeWidth={1.5} />
                  <span className="text-[15px] font-medium">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 size-5.5" strokeWidth={1.5} />
                  <span className="text-[15px] font-medium">
                    {user.phone || t("personalInfo.form.phoneNotAdded")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {editProfileInfo && (
          <CardFooter className="flex justify-end space-x-2 px-0">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              {t("personalInfo.form.cancel")}
            </Button>
            <Button
              type="submit"
              form="profile-form"
              className="rounded-full"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="mr-2">{t("personalInfo.form.saving")}</span>
                  <span className="animate-spin">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                </>
              ) : (
                t("personalInfo.form.save")
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Address Information Card */}
      {editProfileInfo ? (
        <Card className="shadow-none p-0 border-0 rounded-none pb-6 border-b">
          <CardHeader className="p-0">
            <CardTitle>{t("personalInfo.addressInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">
                  {t("personalInfo.form.address")}
                </Label>
                <Input
                  id="address"
                  name="address"
                  form="profile-form"
                  value={profileData.address}
                  onChange={handleInputChange}
                  placeholder={t("personalInfo.form.addressPlaceholder")}
                  className="rounded-lg h-11 shadow-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("personalInfo.form.city")}</Label>
                  <Input
                    id="city"
                    name="city"
                    form="profile-form"
                    value={profileData.city}
                    onChange={handleInputChange}
                    placeholder={t("personalInfo.form.city")}
                    className="rounded-lg h-11 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">
                    {t("personalInfo.form.postalCode")}
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    form="profile-form"
                    value={profileData.postalCode}
                    onChange={handleInputChange}
                    placeholder={t("personalInfo.form.postalCodePlaceholder")}
                    className="rounded-lg h-11 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    {t("personalInfo.form.country")}
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    form="profile-form"
                    value={profileData.country}
                    onChange={handleInputChange}
                    placeholder={t("personalInfo.form.country")}
                    className="rounded-lg h-11 shadow-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Driver's License Verification - Using the SecureLicenseVerification component */}
      <div className="mt-0">
        <SecureLicenseVerification
          userId={user.id || ""}
          userName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
        />
      </div>

      {/* Payment Information Card - Updated with new PaymentMethodManager */}
      <div className="mt-6">
        <PaymentMethodManager
          editMode={editProfileInfo}
          onEditToggle={() => setEditProfileInfo && setEditProfileInfo(true)}
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            paymentMethods: user.paymentMethods,
          }}
        />
      </div>

      <VerificationDialog {...verification} />
    </div>
  );
}
