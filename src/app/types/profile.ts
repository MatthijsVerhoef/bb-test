export interface UserProfileProps {
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
      profilePicture: string | null;
      bio: string | null;
      companyName: string | null;
      kvkNumber: string | null;
      vatNumber: string | null;
      responseRate: number | null;
      responseTime: number | null;
      isVerified: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
      smsNotifications: boolean;
      languagePreference: string;
      lastLogin: Date | null;
      role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
      memberSince: Date;
    };
    stats: {
      totalRentals: number;
      totalIncome: number;
      totalSpent: number;
      cancelledRentals: number;
      completedRentals: number;
      averageRating: number | null;
      responseRate: number | null;
      responseTime: number | null;
      acceptanceRate: number | null;
    };
    listings: {
      id: string;
      title: string;
      pricePerDay: number;
      views: number;
      status: string;
      type: string | null;
      mainImage: string | null;
    }[];
    rentals: {
      id: string;
      startDate: Date;
      endDate: Date;
      status: string;
      totalPrice: number;
      trailerId: string;
      trailerTitle: string;
      trailerImage: string | null;
    }[];
    reviews: {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      trailerTitle: string | null;
      reviewerName: string | null;
    }[];
    favorites: {
      id: string;
      trailerId: string;
      trailerTitle: string;
      trailerImage: string | null;
      pricePerDay: number;
    }[];
    notifications: {
      id: string;
      message: string;
      read: boolean;
      type: string;
      createdAt: Date;
    }[];
    documents: {
      id: string;
      type: string;
      name: string | null;
      verified: boolean;
      expiryDate: Date | null;
      url: string;
    }[];
    wallet: {
      balance: number;
      currency: string;
      lastPayout: Date | null;
    } | null;
  }