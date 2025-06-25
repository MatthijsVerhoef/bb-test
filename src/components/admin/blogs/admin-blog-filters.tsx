'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AdminBlogFiltersProps {
  filters: {
    status: string;
    category: string;
    search: string;
    page: number;
    limit: number;
    sort: string;
    order: string;
  };
  onFilterChange: (filters: Partial<typeof filters>) => void;
}

export function AdminBlogFilters({ filters, onFilterChange }: AdminBlogFiltersProps) {
  const [searchText, setSearchText] = useState(filters.search);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/blogs/categories');
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchText });
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value === "all" ? "" : value });
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    onFilterChange({ category: value === "all" ? "" : value });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchText('');
    onFilterChange({
      status: '',
      category: '',
      search: '',
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.category,
    filters.search,
  ].filter(Boolean).length;

  // Get category name from slug
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category ? category.name : slug;
  };

  return (
    <div className="p-4 border-b">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-grow">
          <form onSubmit={handleSearch}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Zoek op titel of inhoud..."
              className="pl-9 h-10 bg-white rounded-lg border-gray-200"
            />
          </form>
        </div>

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px] h-10 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="published">Gepubliceerd</SelectItem>
            <SelectItem value="draft">Concept</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={filters.category}
          onValueChange={handleCategoryChange}
          disabled={loading || categories.length === 0}
        >
          <SelectTrigger className="w-[180px] h-10 rounded-lg">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset filters button - only show if filters are active */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="default"
            onClick={handleResetFilters}
            className="h-10 rounded-lg"
          >
            <X className="h-4 w-4 mr-2" />
            <span>Reset filters</span>
          </Button>
        )}
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.status && (
            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg">
              <span>Status: {filters.status === 'published' ? 'Gepubliceerd' : 'Concept'}</span>
              <button
                className="ml-2 hover:text-gray-600"
                onClick={() => handleStatusChange('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.category && (
            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg">
              <span>Categorie: {getCategoryName(filters.category)}</span>
              <button
                className="ml-2 hover:text-gray-600"
                onClick={() => handleCategoryChange('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.search && (
            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg">
              <span>Zoeken: {filters.search}</span>
              <button
                className="ml-2 hover:text-gray-600"
                onClick={() => {
                  setSearchText('');
                  onFilterChange({ search: '' });
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