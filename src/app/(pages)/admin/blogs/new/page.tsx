'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBlogPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the full-page editor
    router.push('/admin/blogs/editor');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-pulse">Redirecting to blog editor...</div>
    </div>
  );
}