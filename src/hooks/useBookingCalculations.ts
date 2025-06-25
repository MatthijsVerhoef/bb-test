import { useMemo } from "react";
import { PricingService } from "@/services/pricing.service";

interface UseBookingCalculationsProps {
  startDate?: Date;
  endDate?: Date;
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  needsDelivery: boolean;
  deliveryFee?: number | null;
  securityDeposit?: number | null;
}

export function useBookingCalculations(props: UseBookingCalculationsProps) {
  const calculation = useMemo(() => {
    return PricingService.calculatePricing(props);
  }, [
    props.startDate,
    props.endDate,
    props.pricePerDay,
    props.pricePerWeek,
    props.pricePerMonth,
    props.needsDelivery,
    props.deliveryFee,
    props.securityDeposit,
    props.discountAmount,
    props.insuranceFee,
  ]);

  return {
    rentalDays: calculation.rentalDays,
    basePrice: calculation.basePrice,
    
    serviceFee: calculation.renterServiceFee,
    totalPrice: calculation.totalRenterPrice, 
    
    lessorEarnings: calculation.lessorEarnings,
    platformFee: calculation.lessorPlatformFee,
    
    deliveryFee: calculation.deliveryFee,
    insuranceFee: calculation.insuranceFee,
    discountAmount: calculation.discountAmount,
    securityDeposit: calculation.securityDeposit,
    
    fullCalculation: calculation,
  };
}