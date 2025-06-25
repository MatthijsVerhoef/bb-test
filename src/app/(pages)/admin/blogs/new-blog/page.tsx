'use client';

import { redirect } from 'next/navigation';

export default function NewBlogPage() {
  // Redirect to the full-page editor
  redirect('/admin/blogs/editor');
}