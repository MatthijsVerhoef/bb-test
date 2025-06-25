import { differenceInDays } from "date-fns";

export interface PricingCalculationInput {
  startDate?: Date;
  endDate?: Date;
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  needsDelivery?: boolean;
  deliveryFee?: number | null;
  securityDeposit?: number | null;
  discountAmount?: number | null;
  insuranceFee?: number | null;
}

export interface PricingCalculationResult {
  rentalDays: number;
  basePrice: number;
  
  renterServiceFee: number;
  deliveryFee: number;
  insuranceFee: number;
  discountAmount: number;
  totalRenterPrice: number; 
  
  lessorPlatformFee: number;
  lessorEarnings: number;
  
  securityDeposit: number;
}

export class PricingService {
  // Constants
  static readonly RENTER_SERVICE_FEE_RATE = 0.05;
  static readonly LESSOR_PLATFORM_FEE_RATE = 0.15;
  static readonly DEFAULT_RENTAL_DAYS = 3;

  static calculatePricing(input: PricingCalculationInput): PricingCalculationResult {
    const rentalDays = this.calculateRentalDays(input.startDate, input.endDate);
    
    const basePrice = this.calculateBasePrice({
      rentalDays,
      pricePerDay: input.pricePerDay,
      pricePerWeek: input.pricePerWeek,
      pricePerMonth: input.pricePerMonth,
    });

    const renterServiceFee = this.calculateRenterServiceFee(basePrice);
    const deliveryFee = (input.needsDelivery && input.deliveryFee) ? Number(input.deliveryFee) : 0;
    const insuranceFee = input.insuranceFee ? Number(input.insuranceFee) : 0;
    const discountAmount = input.discountAmount ? Number(input.discountAmount) : 0;
    
    const totalRenterPrice = basePrice + renterServiceFee + deliveryFee + insuranceFee - discountAmount;

    const lessorPlatformFee = this.calculateLessorPlatformFee(basePrice);
    const lessorEarnings = basePrice - lessorPlatformFee;

    const securityDeposit = input.securityDeposit ? Number(input.securityDeposit) : 0;

    return {
      rentalDays,
      basePrice,
      
      renterServiceFee,
      deliveryFee,
      insuranceFee,
      discountAmount,
      totalRenterPrice,
      
      lessorPlatformFee,
      lessorEarnings,
      
      securityDeposit,
    };
  }

  static calculateRentalDays(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate) {
      return this.DEFAULT_RENTAL_DAYS;
    }
    
    const days = differenceInDays(endDate, startDate) + 1;
    return days > 0 ? days : 1;
  }

  static calculateBasePrice(params: {
    rentalDays: number;
    pricePerDay: number;
    pricePerWeek?: number | null;
    pricePerMonth?: number | null;
  }): number {
    const { rentalDays, pricePerDay, pricePerWeek, pricePerMonth } = params;
    
    let price = 0;
    
    if (rentalDays >= 30 && pricePerMonth) {
      const months = Math.floor(rentalDays / 30);
      const remainingDays = rentalDays % 30;
      price = months * pricePerMonth + remainingDays * pricePerDay;
    }
    else if (rentalDays >= 7 && pricePerWeek) {
      const weeks = Math.floor(rentalDays / 7);
      const remainingDays = rentalDays % 7;
      price = weeks * pricePerWeek + remainingDays * pricePerDay;
    }
    else {
      price = rentalDays * pricePerDay;
    }
    
    return Math.round(price * 100) / 100;
  }

  static calculateRenterServiceFee(basePrice: number): number {
    return Math.round(basePrice * this.RENTER_SERVICE_FEE_RATE * 100) / 100;
  }

  static calculateLessorPlatformFee(basePrice: number): number {
    return Math.round(basePrice * this.LESSOR_PLATFORM_FEE_RATE * 100) / 100;
  }

  static calculateLessorEarnings(basePrice: number): number {
    return basePrice - this.calculateLessorPlatformFee(basePrice);
  }

  static validatePricing(
    input: PricingCalculationInput,
    submittedTotal: number,
    tolerance: number = 0.01
  ): boolean {
    const calculated = this.calculatePricing(input);
    const difference = Math.abs(calculated.totalRenterPrice - submittedTotal);
    return difference <= tolerance;
  }

  static formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  static getPricingBreakdown(calculation: PricingCalculationResult) {
    return {
      renter: {
        lines: [
          { label: 'Huurkosten', amount: calculation.basePrice },
          { label: 'Servicekosten (5%)', amount: calculation.renterServiceFee },
          ...(calculation.deliveryFee > 0 ? [{ label: 'Bezorgkosten', amount: calculation.deliveryFee }] : []),
          ...(calculation.insuranceFee > 0 ? [{ label: 'Verzekering', amount: calculation.insuranceFee }] : []),
          ...(calculation.discountAmount > 0 ? [{ label: 'Korting', amount: -calculation.discountAmount }] : []),
        ],
        subtotal: calculation.totalRenterPrice,
        deposit: calculation.securityDeposit,
      },
      lessor: {
        lines: [
          { label: 'Huurinkomsten', amount: calculation.basePrice },
          { label: 'Platform kosten (15%)', amount: -calculation.lessorPlatformFee },
        ],
        total: calculation.lessorEarnings,
      },
    };
  }
}