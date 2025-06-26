import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Ellipsis, HeartHandshake, Share } from "lucide-react";

interface BlogParams {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for the blog page
export async function generateMetadata({
  params,
}: BlogParams): Promise<Metadata> {
  // Await the params Promise
  const { slug } = await params;

  try {
    // Fetch the blog data
    const blog = await prisma.blog.findUnique({
      where: { slug, published: true },
      select: {
        title: true,
        metaTitle: true,
        metaDescription: true,
        excerpt: true,
      },
    });

    if (!blog) {
      return {
        title: "Blog niet gevonden",
      };
    }

    return {
      title: blog.metaTitle || `${blog.title} | Aanhanger Verhuur Platform`,
      description: blog.metaDescription || blog.excerpt || "",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Blog | Aanhanger Verhuur Platform",
      description: "Lees onze laatste blogs over aanhangers en verhuur",
    };
  }
}

// Format date
function formatPublishedDate(dateString: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: BlogParams) {
  // Await the params Promise
  const { slug } = await params;

  if (!slug) {
    return notFound();
  }

  try {
    // Fetch the blog by slug
    const blog = await prisma.blog.findUnique({
      where: {
        slug,
        published: true,
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!blog) {
      return notFound();
    }

    // Fetch related blogs from the same category (limited to 3)
    const relatedBlogs = await prisma.blog.findMany({
      where: {
        id: { not: blog.id },
        published: true,
        categories: {
          some: {
            id: { in: blog.categories.map((category) => category.id) },
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        authorName: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 3,
    });

    return (
      <div className="container max-w-[44%] mx-auto px-4 pt-28 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Blog Header */}
          <div className="mb-8">
            <Link
              href="/blogs"
              className="text-primary flex items-center hover:underline mb-6"
            >
              <ChevronLeft className="size-4.5 me-1" /> Terug naar alle blogs
            </Link>
            <h1 className="text-4xl font-bold mb-6 text-[#222222]">
              {blog.title}
            </h1>

            <div className="flex items-center mb-8">
              <Avatar className="size-11">
                <AvatarImage />
                <AvatarFallback>
                  {blog.authorName.split(" ")[0][0]}
                  {blog.authorName.split(" ")[1][0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col ms-3.5">
                <p className="">{blog.authorName}</p>
                <span className="text-sm text-gray-500">
                  {formatPublishedDate(blog.publishedAt)}
                </span>
              </div>
            </div>

            <div className="border-t border-b w-full flex items-center py-2.5 mb-8 px-3">
              <HeartHandshake
                className="me-auto size-5.5 text-[rgb(107, 107, 107)]"
                strokeWidth={1.2}
              />
              <Share
                className="size-5 text-[rgb(107, 107, 107)]"
                strokeWidth={1.2}
              />
              <Ellipsis
                className="size-5 ms-5.5 text-[rgb(107, 107, 107)]"
                strokeWidth={1.2}
              />
            </div>

            {blog.coverImage && (
              <div className="relative w-full h-112 mb-8">
                <Image
                  src={blog.coverImage}
                  alt={blog.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-sm"
                />
              </div>
            )}
          </div>

          {/* Blog Content */}
          <div className="prose prose-lg max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          </div>

          {blog.categories.length > 0 && (
            <div className="mb-8">
              {blog.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blogs?category=${cat.slug}`}
                  className="inline-block bg-gray-100 text-gray-800 px-4.5 py-1.5 rounded-full mr-2 hover:bg-gray-200"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Related Blogs - Styled to match the blog overview */}
          {relatedBlogs.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold mb-6">
                Gerelateerde artikelen
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {relatedBlogs.map((relatedBlog) => (
                  <div
                    key={relatedBlog.id}
                    className="bg-white flex items-center border-b overflow-hidden"
                  >
                    <div className="pb-6">
                      {relatedBlog.categories &&
                        relatedBlog.categories.length > 0 && (
                          <div className="mb-2">
                            {relatedBlog.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2"
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      <h2 className="text-xl font-bold mb-2">
                        <Link
                          href={`/blog/${relatedBlog.slug}`}
                          className="hover:cursor-pointer"
                        >
                          {relatedBlog.title}
                        </Link>
                      </h2>
                      {relatedBlog.excerpt && (
                        <p className="text-gray-600 mb-4">
                          {relatedBlog.excerpt}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{relatedBlog.authorName}</span>
                        <span>
                          {formatPublishedDate(relatedBlog.publishedAt)}
                        </span>
                      </div>
                    </div>
                    {relatedBlog.coverImage && (
                      <div className="relative ms-8 h-36 min-w-52">
                        <Image
                          src={relatedBlog.coverImage}
                          className="rounded-md"
                          alt={relatedBlog.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl text-red-500 mb-4">Er is iets misgegaan</h1>
        <p>Kon de blogpost niet laden. Probeer het later opnieuw.</p>
        <Link
          href="/blogs"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Terug naar alle blogs
        </Link>
      </div>
    );
  }
}
