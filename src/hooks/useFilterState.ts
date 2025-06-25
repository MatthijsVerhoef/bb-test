// hooks/useFilterState.ts
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FilterState, FilterProps } from '@/app/types/filter-types';

export const useFilterState = (
  currentFilters: FilterProps['currentFilters'],
  onFilterChange: FilterProps['onFilterChange']
) => {
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef(currentFilters);

  // Initialize state from props
  const [filterState, setFilterState] = useState<FilterState>({
    mainCategory: currentFilters.mainCategory || '',
    category: currentFilters.category || '',
    type: currentFilters.type || '',
    minPrice: parseInt(currentFilters.minPrice || '0'),
    maxPrice: parseInt(currentFilters.maxPrice || '1000'),
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
        minPrice: parseInt(currentFilters.minPrice || '0'),
        maxPrice: parseInt(currentFilters.maxPrice || '1000'),
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
    }
  }, [currentFilters]);

  // Debounced filter update
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const newFilters = {
        mainCategory: filterState.mainCategory,
        category: filterState.category,
        type: filterState.type,
        minPrice: filterState.minPrice.toString(),
        maxPrice: filterState.maxPrice.toString(),
        accessories: filterState.accessories,
        driverLicense: filterState.driverLicense,
        length: filterState.length || undefined,
        width: filterState.width || undefined,
        height: filterState.height || undefined,
        weight: filterState.weight || undefined,
        capacity: filterState.capacity || undefined,
        startDate: filterState.startDate ? format(filterState.startDate, 'yyyy-MM-dd') : '',
        endDate: filterState.endDate ? format(filterState.endDate, 'yyyy-MM-dd') : '',
        licenseType: filterState.licenseType,
        homeDelivery: filterState.homeDelivery ? 'true' : '',
        includesInsurance: filterState.includesInsurance ? 'true' : '',
        minRentalDuration: filterState.minRentalDuration,
        maxRentalDuration: filterState.maxRentalDuration,
      };
      
      onFilterChange(newFilters);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filterState, onFilterChange]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
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

    // Immediate reset
    onFilterChange({
      mainCategory: '',
      category: '',
      type: '',
      minPrice: '0',
      maxPrice: '1000',
      accessories: [],
      driverLicense: 'none',
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined,
      capacity: undefined,
      startDate: '',
      endDate: '',
      licenseType: 'none',
      homeDelivery: '',
      includesInsurance: '',
      minRentalDuration: '',
      maxRentalDuration: '',
    });
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