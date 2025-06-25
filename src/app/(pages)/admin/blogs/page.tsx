'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminBlogList } from '@/components/admin/blogs/admin-blog-list';
import { AdminBlogFilters } from '@/components/admin/blogs/admin-blog-filters';
import Link from 'next/link';

export default function AdminBlogsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    page: 1,
    limit: 10,
    sort: 'publishedAt',
    order: 'desc',
  });

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCreateBlog = () => {
    router.push('/admin/blogs/editor');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog beheer</h1>
          <p className="text-muted-foreground">
            Beheer alle blogartikelen van het platform
          </p>
        </div>
        <Button asChild className="gap-2 rounded-lg">
          <Link href="/admin/blogs/editor">
            <PlusCircle className="h-4 w-4" />
            <span>Nieuw artikel</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg">Blog artikelen</CardTitle>
          <CardDescription>
            Bekijk, bewerk en beheer alle blog artikelen
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AdminBlogFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
          <AdminBlogList 
            filters={filters} 
            onPageChange={handlePageChange} 
          />
        </CardContent>
      </Card>
    </div>
  );
}