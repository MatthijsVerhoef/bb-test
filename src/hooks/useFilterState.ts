// hooks/useFilterState.ts
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FilterState, FilterProps } from '@/app/types/filter-types';

export const useFilterState = (
  currentFilters: FilterProps['currentFilters'],
  onFilterChange: FilterProps['onFilterChange']
) => {
  const prevFiltersRef = useRef(currentFilters);
  const hasUserInteracted = useRef(false);

  // Initialize state from props WITHOUT adding defaults
  const [filterState, setFilterState] = useState<FilterState>({
    mainCategory: currentFilters.mainCategory || '',
    category: currentFilters.category || '',
    type: currentFilters.type || '',
    minPrice: currentFilters.minPrice ? parseInt(currentFilters.minPrice) : 0,
    maxPrice: currentFilters.maxPrice ? parseInt(currentFilters.maxPrice) : 1000,
    length: typeof currentFilters.length === 'object' ? currentFilters.length.gte : currentFilters.length || '',
    width: typeof currentFilters.width === 'object' ? currentFilters.width.gte : currentFilters.width || '',
    height: typeof currentFilters.height === 'object' ? currentFilters.height.gte : currentFilters.height || '',
    weight: typeof currentFilters.weight === 'object' ? currentFilters.weight.gte : currentFilters.weight || '',
    capacity: typeof currentFilters.capacity === 'object' ? currentFilters.capacity.gte : currentFilters.capacity || '',
    driverLicense: currentFilters.driverLicense || 'none',
    accessories: Array.isArray(currentFilters.accessories)
      ? currentFilters.accessories
      : currentFilters.accessories?.split(',') || [],
    startDate: currentFilters.startDate ? new Date(currentFilters.startDate) : undefined,
    endDate: currentFilters.endDate ? new Date(currentFilters.endDate) : undefined,
    licenseType: currentFilters.licenseType || 'none',
    homeDelivery: currentFilters.homeDelivery === 'true',
    includesInsurance: currentFilters.includesInsurance === 'true',
    minRentalDuration: currentFilters.minRentalDuration || '',
    maxRentalDuration: currentFilters.maxRentalDuration || '',
  });

  // Sync with incoming props
  useEffect(() => {
    if (JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters)) {
      prevFiltersRef.current = currentFilters;
      
      setFilterState({
        mainCategory: currentFilters.mainCategory || '',
        category: currentFilters.category || '',
        type: currentFilters.type || '',
        minPrice: currentFilters.minPrice ? parseInt(currentFilters.minPrice) : 0,
        maxPrice: currentFilters.maxPrice ? parseInt(currentFilters.maxPrice) : 1000,
        length: typeof currentFilters.length === 'object' ? currentFilters.length.gte : currentFilters.length || '',
        width: typeof currentFilters.width === 'object' ? currentFilters.width.gte : currentFilters.width || '',
        height: typeof currentFilters.height === 'object' ? currentFilters.height.gte : currentFilters.height || '',
        weight: typeof currentFilters.weight === 'object' ? currentFilters.weight.gte : currentFilters.weight || '',
        capacity: typeof currentFilters.capacity === 'object' ? currentFilters.capacity.gte : currentFilters.capacity || '',
        driverLicense: currentFilters.driverLicense || 'none',
        accessories: Array.isArray(currentFilters.accessories)
          ? currentFilters.accessories
          : currentFilters.accessories?.split(',') || [],
          startDate: currentFilters.startDate ? new Date(currentFilters.startDate + 'T00:00:00') : undefined,
          endDate: currentFilters.endDate ? new Date(currentFilters.endDate + 'T00:00:00') : undefined,
        licenseType: currentFilters.licenseType || 'none',
        homeDelivery: currentFilters.homeDelivery === 'true',
        includesInsurance: currentFilters.includesInsurance === 'true',
        minRentalDuration: currentFilters.minRentalDuration || '',
        maxRentalDuration: currentFilters.maxRentalDuration || '',
      });
    }
  }, [currentFilters]);

  // Debounced filter update - ONLY trigger if user has interacted
  useEffect(() => {
    // Don't trigger on initial mount or if user hasn't interacted
    if (!hasUserInteracted.current) {
      return;
    }

    const timer = setTimeout(() => {
      const newFilters: any = {};
      
      // Only include values that are different from defaults
      if (filterState.mainCategory) newFilters.mainCategory = filterState.mainCategory;
      if (filterState.category) newFilters.category = filterState.category;
      if (filterState.type) newFilters.type = filterState.type;
      
      // Only include price if different from defaults
      if (filterState.minPrice !== 0) newFilters.minPrice = filterState.minPrice.toString();
      if (filterState.maxPrice !== 1000) newFilters.maxPrice = filterState.maxPrice.toString();
      
      // Only include non-empty arrays
      if (filterState.accessories.length > 0) newFilters.accessories = filterState.accessories;
      
      // Only include non-default values
      if (filterState.driverLicense !== 'none') newFilters.driverLicense = filterState.driverLicense;
      if (filterState.licenseType !== 'none') newFilters.licenseType = filterState.licenseType;
      
      // Only include non-empty dimensions
      if (filterState.length) newFilters.horizontalWidth = filterState.length;
      if (filterState.width) newFilters.verticalWidth = filterState.width;
      if (filterState.height) newFilters.height = filterState.height;
      if (filterState.weight) newFilters.weight = filterState.weight;
      if (filterState.capacity) newFilters.capacity = filterState.capacity;
      
      // Only include dates if set
      if (filterState.startDate) newFilters.startDate = format(filterState.startDate, 'yyyy-MM-dd');
      if (filterState.endDate) newFilters.endDate = format(filterState.endDate, 'yyyy-MM-dd');
      
      // Only include true boolean values
      if (filterState.homeDelivery) newFilters.homeDelivery = 'true';
      if (filterState.includesInsurance) newFilters.includesInsurance = 'true';
      
      // Only include non-empty durations
      if (filterState.minRentalDuration) newFilters.minRentalDuration = filterState.minRentalDuration;
      if (filterState.maxRentalDuration) newFilters.maxRentalDuration = filterState.maxRentalDuration;
      
      onFilterChange(newFilters);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filterState, onFilterChange]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    // Mark that user has interacted
    hasUserInteracted.current = true;
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    // Mark that user has interacted
    hasUserInteracted.current = true;
    
    setFilterState({
      mainCategory: '',
      category: '',
      type: '',
      minPrice: 0,
      maxPrice: 1000,
      accessories: [],
      driverLicense: 'none',
      length: '',
      width: '',
      height: '',
      weight: '',
      capacity: '',
      startDate: undefined,
      endDate: undefined,
      licenseType: 'none',
      homeDelivery: false,
      includesInsurance: false,
      minRentalDuration: '',
      maxRentalDuration: '',
    });

    // Clear all filters from URL
    onFilterChange({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterState.mainCategory) count++;
    if (filterState.category) count++;
    if (filterState.type && filterState.type !== filterState.category) count++;
    if (filterState.accessories.length > 0) count += filterState.accessories.length;
    if (filterState.driverLicense !== 'none') count++;
    if (filterState.length) count++;
    if (filterState.width) count++;
    if (filterState.height) count++;
    if (filterState.weight) count++;
    if (filterState.capacity) count++;
    if (filterState.minPrice > 0 || filterState.maxPrice < 1000) count++;
    if (filterState.startDate) count++;
    if (filterState.endDate && filterState.startDate !== filterState.endDate) count++;
    if (filterState.licenseType !== 'none') count++;
    if (filterState.homeDelivery) count++;
    if (filterState.includesInsurance) count++;
    if (filterState.minRentalDuration) count++;
    if (filterState.maxRentalDuration) count++;
    return count;
  };

  return {
    filterState,
    updateFilter,
    resetFilters,
    getActiveFiltersCount,
  };
};