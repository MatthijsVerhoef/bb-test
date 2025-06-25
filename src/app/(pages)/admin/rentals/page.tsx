'use client';

import { useState } from 'react';
import { AdminRentalList } from '@/components/admin/rentals/admin-rental-list';
import { AdminRentalFilters } from '@/components/admin/rentals/admin-rental-filters';

export default function AdminRentalsPage() {
  // Initial filter state
  const [filters, setFilters] = useState({
    status: '',
    lessorId: '',
    renterId: '',
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
  });

  // Update filters
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <AdminRentalFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Rental List */}
      <AdminRentalList 
        filters={filters} 
        onPageChange={handlePageChange} 
      />
    </div>
  );
}