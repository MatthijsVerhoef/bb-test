// components/profile/common/payment/PaymentMethodManager.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  CheckCircle,
  PlusCircle,
  Trash2,
  CreditCard as CreditCardIcon,
  Shield,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  useStripePaymentMethods,
  StripePaymentMethodsProvider,
  AddPaymentMethodForm,
  type PaymentMethod,
} from "@/hooks/useStripePaymentMethods";
import { useTranslation } from "@/lib/i18n/client";

interface PaymentMethodManagerProps {
  editMode?: boolean;
  onEditToggle?: () => void;
  showCardHeader?: boolean;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    role?: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
    paymentMethods?: {
      defaultMethod?: string;
      stripeConnected?: boolean;
    };
  };
}

export default function PaymentMethodManager({
  editMode = false,
  onEditToggle,
  user,
  showCardHeader = true,
}: PaymentMethodManagerProps) {
  const { t } = useTranslation("profile");

  const {
    paymentMethods,
    isLoading,
    error,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    showAddPaymentMethodForm,
    setShowAddPaymentMethodForm,
    clientSecret,
    refreshPaymentMethods,
    currentLocale,
  } = useStripePaymentMethods();

  const handleAddPaymentMethod = () => {
    addPaymentMethod();
  };

  const handlePaymentMethodRemoved = async (paymentMethodId: string) => {
    try {
      await removePaymentMethod(paymentMethodId);
      toast.success(t("paymentMethod.methods.removeSuccess"));
    } catch (error) {
      toast.error(t("paymentMethod.methods.removeError"));
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethod(paymentMethodId);
      toast.success(t("paymentMethod.methods.setDefaultSuccess"));
    } catch (error) {
      toast.error(t("paymentMethod.methods.setDefaultError"));
    }
  };

  const handlePaymentMethodDialogClose = () => {
    setShowAddPaymentMethodForm(false);
  };

  const handlePaymentMethodAdded = () => {
    // Close the form
    setShowAddPaymentMethodForm(false);

    // Force refresh from API with cache busting
    refreshPaymentMethods(true);

    // Show success message
    toast.success(t("paymentMethod.methods.addSuccess"));

    // Do an additional refresh after a short delay to ensure it's updated
    // This helps with any potential race conditions
    setTimeout(() => {
      refreshPaymentMethods(true);
    }, 1000);
  };

  // Format card brand name
  const formatCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
      discover: "Discover",
      jcb: "JCB",
      diners: "Diners Club",
      unionpay: "UnionPay",
    };

    return brands[brand] || brand;
  };

  // Get card brand icon
  const getCardIcon = (brand: string) => {
    if (brand === "visa") {
      return (
        <img
          alt="visa"
          src="/assets/payment/visa.png"
          className="size-7 bg-white"
        />
      );
    } else if (brand === "mastercard") {
      return (
        <img
          alt="mastercard"
          src="/assets/payment/mastercard.webp"
          className="size-6 bg-white object-contain"
        />
      );
    } else if (brand === "amex") {
      <img
        alt="amex"
        src="/assets/payment/amex.png"
        className="size-6 bg-white object-contain"
      />;
    }

    return <CreditCardIcon className="h-5 w-5" />;
  };

  const isLessor = user.role === "LESSOR" || user.role === "ADMIN";

  return (
    <Card className="shadow-none border-none p-0">
      {showCardHeader && (
        <CardHeader className="py-2 px-0">
          <CardTitle className="font-medium">
            {t("paymentMethod.title")}
          </CardTitle>
          <CardDescription className="text-dark mt-1">
            {isLessor
              ? t("paymentMethod.subtitle.lessor")
              : t("paymentMethod.subtitle.renter")}
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="px-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || t("paymentMethod.error")}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {paymentMethods.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-start justify-between p-4 rounded-lg border ${
                        method.isDefault
                          ? "bg-[#F7F7F7] border-0"
                          : "bg-[#F7F7F7] border-0"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-white h-7 flex items-center justify-center px-2 rounded-md">
                          {method.card && getCardIcon(method.card.brand)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {method.card && (
                              <>
                                {formatCardBrand(method.card.brand)} ••••{" "}
                                {method.card.last4}
                              </>
                            )}
                          </div>
                          <div className="text-[13px] text-muted-foreground">
                            {method.card && (
                              <>
                                {t("paymentMethod.methods.expires")}{" "}
                                {method.card.expMonth
                                  .toString()
                                  .padStart(2, "0")}
                                /{method.card.expYear.toString().slice(-2)}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {method.isDefault ? (
                          <Badge
                            variant="outline"
                            className="bg-[#222222] text-white py-1.5 flex items-center gap-1"
                          >
                            {t("paymentMethod.methods.defaultBadge")}
                          </Badge>
                        ) : (
                          editMode && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(method.id)}
                              className="text-xs"
                            >
                              {t("paymentMethod.methods.setAsDefault")}
                            </Button>
                          )
                        )}

                        {editMode && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handlePaymentMethodRemoved(method.id)
                                  }
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {t("paymentMethod.methods.removeTooltip")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!editMode ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onEditToggle}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("paymentMethod.methods.manage")}
                  </Button>
                ) : (
                  <Button onClick={handleAddPaymentMethod} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("paymentMethod.methods.addMethod")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 bg-[#F7F7F7] rounded-lg py-8 px-6">
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-full">
                    <CreditCard
                      className="h-10 w-10 text-slate-400"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("paymentMethod.methods.noMethods")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("paymentMethod.methods.noMethodsDescription")}
                  </p>
                </div>
                <Button onClick={handleAddPaymentMethod} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("paymentMethod.methods.addMethod")}
                </Button>
              </div>
            )}

            {/* For lessors - Connect section (only in edit mode) */}
            {isLessor && editMode && (
              <div className="border-t pt-4 mt-6">
                <div className="space-y-3">
                  <h4 className="font-medium">
                    {t("paymentMethod.lessor.payoutTitle")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("paymentMethod.lessor.payoutDescription")}
                  </p>

                  {user.paymentMethods?.stripeConnected ? (
                    <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      <span>{t("paymentMethod.lessor.connected")}</span>
                    </div>
                  ) : (
                    <Button
                      className="bg-[#635BFF] hover:bg-[#5851DB] text-white"
                      onClick={() => {
                        toast.info(t("paymentMethod.lessor.connectToast"));
                      }}
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M33.334 13.334H6.667v13.333h26.667V13.334z"
                          fill="#fff"
                        />
                        <path
                          d="M16.667 21.667a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                          fill="#635BFF"
                        />
                      </svg>
                      {t("paymentMethod.lessor.connectButton")}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Secure payment notice */}
            <div className="flex items-center justify-start text-sm text-muted-foreground mt-4">
              <Shield className="h-4 w-4 mr-2" />
              <span>{t("paymentMethod.security")}</span>
            </div>
          </div>
        )}

        {/* Dialog for adding a new payment method */}
        {showAddPaymentMethodForm && clientSecret && (
          <Dialog
            open={showAddPaymentMethodForm}
            onOpenChange={(open) => {
              if (!open) {
                // Add a small delay before closing to prevent race conditions
                setTimeout(() => {
                  handlePaymentMethodDialogClose();
                }, 100);
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("paymentMethod.addDialog.title")}</DialogTitle>
                <DialogDescription>
                  {t("paymentMethod.addDialog.description")}
                </DialogDescription>
              </DialogHeader>

              {/* Key is important to force remounting when dialog reopens */}
              <StripePaymentMethodsProvider
                clientSecret={clientSecret}
                locale={currentLocale}
                key={`stripe-elements-${Date.now()}`}
              >
                <AddPaymentMethodForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentMethodAdded}
                  onCancel={handlePaymentMethodDialogClose}
                />
              </StripePaymentMethodsProvider>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for displaying when no payment methods exist
export function EmptyPaymentState({
  onAddPaymentMethod,
}: {
  onAddPaymentMethod: () => void;
}) {
  return (
    <div className="flex justify-center py-4">
      <div className="relative">
        {/* QR Code with scan effect */}
        <div className="w-60 p-2 h-60 border border-gray-200 rounded-lg relative overflow-hidden flex items-center justify-center">
          <QrCode className="h-24 w-24 text-gray-300" />
          {/* Scanning effect */}
          <div className="absolute top-12 left-0 right-0 h-32 bg-gradient-to-b from-primary to-white opacity-50 transform translate-y-16 animate-scan"></div>
        </div>
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-3 -mt-[1px] -ml-[1px] border-t-3 border-primary rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-r-3 border-t-3 -mt-[1px] -mr-[1px] border-primary rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-3 -mb-[1px] -ml-[1px] border-b-3 border-primary rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-3 -mb-[1px] -mr-[1px] border-b-3 border-primary rounded-br-lg"></div>
      </div>
    </div>
  );
}
