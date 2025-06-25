export enum RentalStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
    LATE_RETURN = "LATE_RETURN",
    DISPUTED = "DISPUTED",
  }
  
  export enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  }
  
  export enum DamageStatus {
    NONE = "NONE",
    MINOR = "MINOR",
    MODERATE = "MODERATE",
    SEVERE = "SEVERE",
  }
  
  // Extended interfaces
  export interface RentalData {
    id: string;
    startDate: Date;
    endDate: Date;
    status: RentalStatus | string;
    totalPrice: number;
    trailerId: string;
    trailerTitle: string;
    trailerImage: string | null;
    pickupLocation?: string;
    dropoffLocation?: string;
    renter?: {
      id?: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      email?: string;
      profilePicture?: string;
    };
    lessor?: {
      id?: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      email?: string;
      profilePicture?: string;
    };
    actualReturnDate?: Date;
    serviceFee?: number;
    insuranceFee?: number;
    deliveryFee?: number;
    securityDeposit?: number;
    discountAmount?: number;
    needsDelivery?: boolean;
    cancellationReason?: string;
    cancellationDate?: Date;
    specialNotes?: string;
    payment?: {
      id: string;
      amount: number;
      status: PaymentStatus | string;
      paymentMethod: string;
      refundAmount?: number;
      refundReason?: string;
      refundDate?: Date;
    };
    rentalExtensions?: {
      id: string;
      originalEndDate: Date;
      newEndDate: Date;
      additionalCost: number;
      approved: boolean | null;
      approvedDate?: Date;
      note?: string;
      requestDate: Date;
    }[];
    damageReports?: {
      id: string;
      description: string;
      date: Date;
      damageStatus: DamageStatus | string;
      photoUrls: string[];
      repairCost?: number;
      resolved: boolean;
      reviewerId?: string;
    }[];
    insuranceClaims?: {
      id: string;
      claimNumber?: string;
      description: string;
      date: Date;
      status: string;
      amount?: number;
      evidenceUrls: string[];
    }[];
    trailer?: {
      id: string;
      title: string;
      description: string;
      licensePlate?: string;
      features: any;
      address?: string;
      postalCode?: string;
      city?: string;
      cancellationPolicy?: string;
    };
    insurancePolicy?: {
      id: string;
      provider: string;
      type: string;
      coverageDetails?: string;
      deductible?: number;
    };
    renterId: string;
    lessorId: string;
  }
  
  export interface RentalDetailsProps {
    rental: RentalData;
    role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
    onClose: () => void;
  }
  
  export interface RentalManagementProps extends RentalDetailsProps {
    onStatusUpdate: (
      rentalId: string,
      newStatus: string,
      note?: string
    ) => Promise<void>;
    onExtendRental?: (
      rentalId: string,
      newEndDate: Date,
      note?: string
    ) => Promise<void>;
    onAddDamageReport?: (
      rentalId: string,
      damageReport: Partial<RentalData["damageReports"][0]>
    ) => Promise<void>;
  }
  
  export interface CancellationProps extends RentalDetailsProps {
    onCancel: (rentalId: string, reason: string) => Promise<void>;
  }
  
  export interface ExtensionDialogProps extends RentalDetailsProps {
    onExtend: (
      rentalId: string,
      newEndDate: Date,
      note?: string
    ) => Promise<void>;
  }
  
  export interface DamageReportDialogProps extends RentalDetailsProps {
    onSubmitDamage: (
      rentalId: string,
      damage: Partial<RentalData["damageReports"][0]>
    ) => Promise<void>;
  }