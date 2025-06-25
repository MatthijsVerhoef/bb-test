// types/filter-types.ts
export interface FilterState {
    mainCategory: string;
    category: string;
    type: string;
    minPrice: number;
    maxPrice: number;
    length: string;
    width: string;
    height: string;
    weight: string;
    capacity: string;
    driverLicense: string;
    accessories: string[];
    startDate?: Date;
    endDate?: Date;
    licenseType: string;
    homeDelivery: boolean;
    includesInsurance: boolean;
    minRentalDuration: string;
    maxRentalDuration: string;
  }
  
  export interface FilterProps {
    currentFilters: {
      mainCategory?: string;
      category?: string;
      type?: string;
      minPrice?: string;
      maxPrice?: string;
      available?: string;
      length?: string | { gte: string };
      width?: string | { gte: string };
      height?: string | { gte: string };
      weight?: string | { gte: string };
      capacity?: string | { gte: string };
      driverLicense?: string;
      accessories?: string[];
      startDate?: string;
      endDate?: string;
      licenseType?: string;
      homeDelivery?: string;
      includesInsurance?: string;
      minRentalDuration?: string;
      maxRentalDuration?: string;
    };
    onFilterChange: (filters: any) => void;
  }
  
  export interface DimensionFilterProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    icon: React.ReactNode;
    unit: string;
    id: string;
  }