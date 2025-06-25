// components/profile/common/payment/QuickPaymentButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStripePaymentMethods, StripePaymentMethodsProvider, AddPaymentMethodForm } from "@/hooks/useStripePaymentMethods";
import { CreditCard, Plus, Check, Shield } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface QuickPaymentButtonProps {
  onPaymentMethodSelected?: (paymentMethodId: string) => void;
  className?: string;
  buttonText?: string;
  disabled?: boolean;
}

export default function QuickPaymentButton({
  onPaymentMethodSelected,
  className = "",
  buttonText = "Betaal",
  disabled = false,
}: QuickPaymentButtonProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  
  const {
    paymentMethods,
    isLoading,
    error,
    addPaymentMethod,
    showAddPaymentMethodForm,
    setShowAddPaymentMethodForm,
    clientSecret,
    refreshPaymentMethods,
  } = useStripePaymentMethods();

  // Set default payment method as selected when loaded
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(method => method.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      } else {
        setSelectedPaymentMethod(paymentMethods[0].id);
      }
    }
  }, [paymentMethods]);

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handlePayNow = () => {
    if (selectedPaymentMethod) {
      onPaymentMethodSelected?.(selectedPaymentMethod);
      setIsPaymentDialogOpen(false);
      toast.success("Betaling gestart");
    } else {
      toast.error("Selecteer eerst een betaalmethode");
    }
  };

  const handleAddPaymentMethod = () => {
    addPaymentMethod();
  };

  const handlePaymentMethodAdded = () => {
    // Close the form
    setShowAddPaymentMethodForm(false);
    
    // For demo purposes - in a real app, this would come from the API
    // Simulate API delay for UI feedback
    setTimeout(() => {
      // Either refresh from API in a real implementation
      refreshPaymentMethods();
      
      // Or for demo, simulate a new payment method
      if (paymentMethods.length === 0) {
        // Add a mock payment method for demo purposes
        const mockPaymentMethod = {
          id: "pm_" + Math.random().toString(36).substring(2, 10),
          type: "card",
          card: {
            brand: "visa",
            last4: (1000 + Math.floor(Math.random() * 9000)).toString(),
            expMonth: 12,
            expYear: 2025,
          },
          created: Date.now() / 1000,
          isDefault: true, // Make default if it's the first
        };
        
        // In a real implementation, we would refresh the payment methods from the API
        // For demo purposes, we'll just add the mock payment method directly
        // @ts-ignore - Access private method for demo
        if (typeof setPaymentMethods === 'function') {
          // @ts-ignore - Access private method for demo
          setPaymentMethods([mockPaymentMethod]);
        }
        
        // Select the new payment method
        setSelectedPaymentMethod(mockPaymentMethod.id);
      }
      
      toast.success("Betaalmethode toegevoegd");
      
      // Close the payment dialog if it was open
      setIsPaymentDialogOpen(false);
    }, 500);
  };

  const handleCloseAddPaymentMethodDialog = () => {
    setShowAddPaymentMethodForm(false);
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

  // Determine if user has a default payment method
  const hasDefaultPaymentMethod = paymentMethods.some(method => method.isDefault);

  // If loading or no payment methods, show loading state or add payment button
  if (isLoading) {
    return (
      <Button className={className} disabled>
        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
        Laden...
      </Button>
    );
  }

  // If user has payment methods, show a popover for quick select
  if (paymentMethods.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button className={className} disabled={disabled}>
            <CreditCard className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <h3 className="font-medium">Selecteer betaalmethode</h3>
            <p className="text-sm text-muted-foreground">
              Kies een opgeslagen betaalmethode of voeg een nieuwe toe
            </p>
          </div>

          <RadioGroup 
            className="p-4 space-y-3" 
            value={selectedPaymentMethod || undefined}
            onValueChange={handlePaymentMethodSelect}
          >
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center space-x-2 p-2 rounded-md border ${
                  selectedPaymentMethod === method.id ? "border-primary bg-primary/5" : "border-transparent"
                } hover:bg-muted/50 cursor-pointer`}
                onClick={() => handlePaymentMethodSelect(method.id)}
              >
                <RadioGroupItem 
                  value={method.id} 
                  id={`payment-${method.id}`} 
                  className="mr-2"
                />
                <div className="flex items-center justify-between w-full">
                  <Label htmlFor={`payment-${method.id}`} className="flex items-center cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      {method.card && (
                        <span>
                          {formatCardBrand(method.card.brand)} •••• {method.card.last4}
                        </span>
                      )}
                    </div>
                  </Label>
                  {method.isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center">
                      <Check className="h-3 w-3 mr-1" /> Standaard
                    </span>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="p-4 flex flex-col space-y-2 border-t">
            <Button onClick={handlePayNow} className="w-full">
              Betaal nu
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleAddPaymentMethod}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe betaalmethode
            </Button>
          </div>

          <div className="px-4 pb-3 pt-1">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <Shield className="h-3 w-3 mr-1" />
              <span>Beveiligde betalingen via Stripe</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // If no payment methods, show button that opens dialog
  return (
    <>
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogTrigger asChild>
          <Button className={className} disabled={disabled}>
            <CreditCard className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Betaalmethode toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een betaalmethode toe om door te gaan met de betaling
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-center mb-4">
              Je hebt nog geen betaalmethode toegevoegd. Voeg er een toe om door te gaan.
            </p>
            <Button 
              onClick={handleAddPaymentMethod} 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Betaalmethode toevoegen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding a new payment method */}
      {showAddPaymentMethodForm && clientSecret && (
        <Dialog
          open={showAddPaymentMethodForm}
          onOpenChange={handleCloseAddPaymentMethodDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Betaalmethode toevoegen</DialogTitle>
              <DialogDescription>
                Voeg een nieuwe kaart of betaalmethode toe voor je huurreserveringen
              </DialogDescription>
            </DialogHeader>
            <StripePaymentMethodsProvider clientSecret={clientSecret}>
              <AddPaymentMethodForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentMethodAdded}
                onCancel={handleCloseAddPaymentMethodDialog}
              />
            </StripePaymentMethodsProvider>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}