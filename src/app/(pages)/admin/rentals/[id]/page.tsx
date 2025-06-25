'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminRentalDetail } from '@/components/admin/rentals/admin-rental-detail';
import { use } from 'react';

export default function AdminRentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/rentals')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar overzicht
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Verhuring Details</h1>
        <p className="text-sm text-muted-foreground">
          ID: {id}
        </p>
      </div>

      {/* Rental Detail */}
      <AdminRentalDetail rentalId={id} />
    </div>
  );
}