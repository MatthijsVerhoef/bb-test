"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminBlogForm } from "@/components/admin/blogs/admin-blog-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  authorName: string;
  metaTitle: string | null;
  metaDescription: string | null;
  categories: { id: string; name: string }[];
}

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/blogs/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch blog");
        }
        const data = await response.json();
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError(
          "Er is een fout opgetreden bij het ophalen van het blog artikel."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id !== "new-blog") {
      fetchBlog();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    router.push("/admin/blogs");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <h1 className="text-2xl font-semibold">Fout</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-red-500">{error}</div>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Probeer opnieuw
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
        <h1 className="text-2xl font-semibold">
          {id === "new-blog"
            ? "Nieuw blog artikel"
            : `Bewerk: ${blog?.title || ""}`}
        </h1>
      </div>

      <AdminBlogForm blog={blog} isNew={id === "new-blog"} />
    </div>
  );
}
