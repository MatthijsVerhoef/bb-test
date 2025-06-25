'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  RotateCcw, 
  Calendar, 
  SortAsc, 
  SortDesc, 
  CircleDot, 
  Ban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Hourglass,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";

interface AdminRentalFiltersProps {
  filters: {
    status?: string;
    lessorId?: string;
    renterId?: string;
    page: number;
    limit: number;
    sort: string;
    order: string;
  };
  onFilterChange: (filters: any) => void;
}

export function AdminRentalFilters({ filters, onFilterChange }: AdminRentalFiltersProps) {
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Status options with icons
  const statusOptions = [
    { value: '', label: 'Alle statussen', icon: <CircleDot className="h-4 w-4" /> },
    { value: 'PENDING', label: 'In afwachting', icon: <Hourglass className="h-4 w-4" /> },
    { value: 'CONFIRMED', label: 'Bevestigd', icon: <CheckCircle2 className="h-4 w-4" /> },
    { value: 'ACTIVE', label: 'Actief', icon: <CircleDot className="h-4 w-4 text-green-500" /> },
    { value: 'COMPLETED', label: 'Voltooid', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
    { value: 'CANCELLED', label: 'Geannuleerd', icon: <Ban className="h-4 w-4 text-red-500" /> },
    { value: 'LATE_RETURN', label: 'Verlate teruggave', icon: <Clock className="h-4 w-4 text-orange-500" /> },
    { value: 'DISPUTED', label: 'In geschil', icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
  ];

  // Sort options
  const sortOptions = [
    { value: 'createdAt', label: 'Aanmaakdatum', icon: <Calendar className="h-4 w-4" /> },
    { value: 'startDate', label: 'Startdatum', icon: <Calendar className="h-4 w-4" /> },
    { value: 'endDate', label: 'Einddatum', icon: <Calendar className="h-4 w-4" /> },
    { value: 'totalPrice', label: 'Prijs', icon: <span className="text-sm font-semibold">€</span> },
  ];
  
  // Order options
  const orderOptions = [
    { value: 'desc', label: 'Aflopend', icon: <SortDesc className="h-4 w-4" /> },
    { value: 'asc', label: 'Oplopend', icon: <SortAsc className="h-4 w-4" /> },
  ];

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    onFilterChange({ sort: value });
  };

  // Handle order change
  const handleOrderChange = (value: string) => {
    onFilterChange({ order: value === "asc" ? "asc" : "desc" });
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine if search text looks like an ID (UUID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchText);
    
    // If it's a UUID, search by rental ID
    if (isUuid) {
      // Redirect to rental detail page
      window.location.href = `/admin/rentals/${searchText}`;
      return;
    }
    
    // Otherwise, search by user name or email
    // This would require a more complex backend implementation
    // For simplicity, just alert that this feature is not implemented
    alert('Zoeken op naam of e-mail is nog niet geïmplementeerd.');
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchText('');
    onFilterChange({
      status: '',
      lessorId: '',
      renterId: '',
      sort: 'createdAt',
      order: 'desc',
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.sort !== "createdAt" ? filters.sort : null,
    filters.order !== "desc" ? filters.order : null
  ].filter(Boolean).length;

  // Get current status option
  const currentStatus = statusOptions.find(o => o.value === filters.status);
  // Get current sort option
  const currentSort = sortOptions.find(o => o.value === filters.sort);
  // Get current order option
  const currentOrder = orderOptions.find(o => o.value === filters.order);

  return (
    <div className="mb-8 space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verhuringen</h1>
          <p className="text-muted-foreground mt-1">
            Beheer alle verhuringen op het platform
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={filters.status ? "secondary" : "outline"} 
                size="sm" 
                className="h-9 px-3"
              >
                {filters.status ? (
                  <div className="flex items-center gap-1.5">
                    {currentStatus?.icon}
                    <span>{currentStatus?.label}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter op status</h4>
                <Separator className="my-2" />
                <div className="space-y-1">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.status === option.value ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => handleStatusChange(option.value)}
                    >
                      <span className="mr-2">{option.icon}</span>
                      <span>{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Sort Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={(filters.sort !== "createdAt" || filters.order !== "desc") ? "secondary" : "outline"} 
                size="sm" 
                className="h-9 px-3"
              >
                <div className="flex items-center gap-1.5">
                  {filters.order === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  <span>{currentSort?.label || "Sorteren"}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Sorteren</h4>
                <Separator className="my-2" />
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sorteer op</Label>
                  <div className="space-y-1">
                    {sortOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.sort === option.value ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start h-8"
                        onClick={() => handleSortChange(option.value)}
                      >
                        <span className="mr-2">{option.icon}</span>
                        <span>{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Volgorde</Label>
                  <ToggleGroup 
                    type="single" 
                    value={filters.order}
                    onValueChange={(value) => value && handleOrderChange(value)}
                    className="justify-start"
                  >
                    {orderOptions.map((option) => (
                      <ToggleGroupItem 
                        key={option.value} 
                        value={option.value}
                        className="flex items-center gap-1 data-[state=on]:bg-secondary"
                      >
                        {option.icon}
                        <span className="text-xs">{option.label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                {(filters.sort !== "createdAt" || filters.order !== "desc") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs justify-start mt-2"
                    onClick={() => {
                      handleSortChange("createdAt");
                      handleOrderChange("desc");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Reset sortering
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Filter Button - only show if filters are active */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-3"
            >
              <X className="h-4 w-4 mr-1.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="relative">
        <form onSubmit={handleSearch}>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Zoek op ID, naam of e-mail..."
            className="pl-10 h-10 bg-background border-muted"
          />
        </form>
      </div>
      
      {/* Active Filters Indicators */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge 
              variant="secondary" 
              className="py-1.5 px-3 gap-1.5 font-normal"
            >
              <span className="flex items-center gap-1.5">
                {currentStatus?.icon}
                <span>{currentStatus?.label}</span>
              </span>
              <button 
                className="ml-1.5 hover:text-muted-foreground" 
                onClick={() => handleStatusChange('')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(filters.sort !== "createdAt" || filters.order !== "desc") && (
            <Badge 
              variant="secondary" 
              className="py-1.5 px-3 gap-1.5 font-normal"
            >
              <span className="flex items-center gap-1.5">
                {filters.order === "asc" ? (
                  <SortAsc className="h-3.5 w-3.5" />
                ) : (
                  <SortDesc className="h-3.5 w-3.5" />
                )}
                <span>
                  {filters.sort !== "createdAt" ? currentSort?.label : "Standaard sortering"}
                  {filters.order !== "desc" ? " (oplopend)" : ""}
                </span>
              </span>
              <button 
                className="ml-1.5 hover:text-muted-foreground" 
                onClick={() => {
                  handleSortChange("createdAt");
                  handleOrderChange("desc");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}