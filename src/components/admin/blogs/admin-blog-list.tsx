'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Edit, 
  Trash, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  CircleIcon,
  AlertTriangle,
  MoreHorizontal,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface AdminBlogListProps {
  filters: {
    status: string;
    category: string;
    search: string;
    page: number;
    limit: number;
    sort: string;
    order: string;
  };
  onPageChange: (page: number) => void;
}

export function AdminBlogList({ filters, onPageChange }: AdminBlogListProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch blogs when filters change
  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.set('status', filters.status);
        if (filters.category) queryParams.set('category', filters.category);
        if (filters.search) queryParams.set('search', filters.search);
        queryParams.set('page', String(filters.page));
        queryParams.set('limit', String(filters.limit));
        queryParams.set('sort', filters.sort);
        queryParams.set('order', filters.order);

        // Fetch blogs from API
        const response = await fetch(`/api/admin/blogs?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }
        
        const data = await response.json();
        setBlogs(data.blogs);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Er is een fout opgetreden bij het ophalen van de blogs.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [filters]);

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: nl });
  };

  // Handle blog view
  const handleViewBlog = (slug: string) => {
    window.open(`/blog/${slug}`, '_blank');
  };

  // Handle blog edit
  const handleEditBlog = (id: string) => {
    router.push(`/admin/blogs/editor?id=${id}`);
  };

  // Handle blog deletion
  const handleDeleteBlog = async (id: string) => {
    setBlogToDelete(id);
  };

  const confirmDeleteBlog = async () => {
    if (!blogToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/blogs/${blogToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete blog');
      }
      
      // Remove from the list
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== blogToDelete));
      
      // Check if we need to go to previous page
      if (blogs.length === 1 && pagination.page > 1) {
        onPageChange(pagination.page - 1);
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      // Could show an error toast here
    } finally {
      setIsDeleting(false);
      setBlogToDelete(null);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    onPageChange(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100">
              <TableHead className="text-xs font-medium text-gray-600">
                Titel
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Categorieën
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Auteur
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Datum
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600 text-right">
                Acties
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i} className="border-gray-100">
                <TableCell className="py-4">
                  <Skeleton className="h-5 w-48" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <div className="text-gray-400 mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Fout bij laden
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
        <Button
          onClick={() => onPageChange(1)}
          variant="outline"
          className="rounded-lg"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Probeer opnieuw
        </Button>
      </div>
    );
  }

  // Empty state
  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <div className="text-gray-400 mb-4">
          <FileText className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Geen blogs gevonden
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Er zijn geen blogs die voldoen aan de opgegeven filtercriteria.
        </p>
        <Button
          onClick={handleResetFilters}
          variant="outline"
          className="rounded-lg"
        >
          Reset filters
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100">
              <TableHead className="text-xs font-medium text-gray-600">
                Titel
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Categorieën
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Auteur
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Datum
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600 text-right">
                Acties
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.map((blog) => (
              <TableRow key={blog.id} className="border-gray-100">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {blog.coverImage ? (
                        <Image
                          src={blog.coverImage}
                          alt={blog.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <FileText className="h-5 w-5 m-auto text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{blog.title}</p>
                      <p className="text-xs text-gray-500 truncate">/blog/{blog.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {blog.categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="bg-gray-100 text-gray-800 rounded-full text-xs font-normal"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-100 text-xs text-gray-600">
                        {blog.authorName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700">{blog.authorName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {blog.published ? (
                    <Badge className="bg-green-50 text-green-700 rounded-full">
                      <CircleIcon className="h-2 w-2 fill-current mr-1.5" />
                      Gepubliceerd
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 rounded-full">
                      <CircleIcon className="h-2 w-2 fill-current mr-1.5" />
                      Concept
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    {blog.publishedAt 
                      ? formatDate(blog.publishedAt)
                      : formatDate(blog.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleViewBlog(blog.slug)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Bekijken</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            asChild
                          >
                            <Link href={`/admin/blogs/editor?id=${blog.id}`}>
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Bewerken</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                        >
                          <Trash className="h-4 w-4 text-gray-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Verwijder blog artikel</AlertDialogTitle>
                          <AlertDialogDescription>
                            Weet je zeker dat je het artikel &quot;{blog.title}&quot; wilt verwijderen?
                            Deze actie kan niet ongedaan worden gemaakt.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteBlog(blog.id)}
                          >
                            Verwijderen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {pagination.totalItems} artikelen gevonden
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="h-8 w-8 rounded-lg border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 px-3">
                {Array.from(
                  { length: Math.min(7, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 3) {
                      pageNum = pagination.totalPages - 6 + i;
                    } else {
                      pageNum = pagination.page - 3 + i;
                    }

                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <Button
                        key={i}
                        variant={
                          pageNum === pagination.page ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                          "h-8 w-8 rounded-lg",
                          pageNum === pagination.page
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  onPageChange(
                    Math.min(pagination.totalPages, pagination.page + 1)
                  )
                }
                disabled={pagination.page === pagination.totalPages}
                className="h-8 w-8 rounded-lg border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              Pagina {pagination.page} van {pagination.totalPages}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!blogToDelete} onOpenChange={(open) => !open && setBlogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verwijder blog artikel</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit blog artikel wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteBlog}
              disabled={isDeleting}
            >
              {isDeleting ? 'Bezig met verwijderen...' : 'Verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}