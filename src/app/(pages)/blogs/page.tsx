import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

// Define types for clarity
interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  authorName: string;
  categories: BlogCategory[];
}

interface BlogListProps {
  searchParams: { page?: string; category?: string };
}

export default async function BlogList({ searchParams }: BlogListProps) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 9;
  const category = searchParams.category;
  const skip = (page - 1) * limit;

  // Build filter conditions for blogs
  const blogWhere: any = { published: true };
  if (category) {
    blogWhere.categories = { some: { slug: category } };
  }

  // Fetch blogs, total count, and categories concurrently
  const [blogs, totalBlogs, categories] = await Promise.all([
    prisma.blog.findMany({
      where: blogWhere,
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
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.blog.count({ where: blogWhere }),
    prisma.blogCategory.findMany({
      where: { posts: { some: { published: true } } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalBlogs / limit);

  const formatPublishedDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto w-[44%] px-4 pt-28 pb-8">
      {/* Category Filter */}
      <div className="mb-8 gap-x-4 flex items-center border-b">
        <Link
          href={`/blogs`}
          className={`mr-2 pb-3 text-[15px] -mb-[1px] ${
            !category ? "text-black border-b border-black" : "text-gray-500"
          }`}
        >
          Alle blogs
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/blogs?category=${cat.slug}`}
            className={`mr-2 pb-3 text-[15px] -mb-[1px] ${
              category === cat.slug
                ? "text-black border-b border-black"
                : "text-gray-500"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12">Geen blogs gevonden</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white flex items-center border-b overflow-hidden"
              >
                <div className="pb-6">
                  {blog.categories.length > 0 && (
                    <div className="mb-2">
                      {blog.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold mb-2">
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="hover:cursor-pointer"
                    >
                      {blog.title}
                    </Link>
                  </h2>
                  {blog.excerpt && (
                    <p className="text-gray-600 mb-4">{blog.excerpt}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{blog.authorName}</span>
                    <span>{formatPublishedDate(blog.publishedAt)}</span>
                  </div>
                </div>
                {blog.coverImage && (
                  <div className="relative ms-8 h-36 min-w-52">
                    <Image
                      src={blog.coverImage}
                      className="rounded-md"
                      alt={blog.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              {page > 1 && (
                <Link
                  href={`/blogs?page=${page - 1}${
                    category ? `&category=${category}` : ""
                  }`}
                  className="px-4 py-2 bg-gray-200 rounded-l"
                >
                  Vorige
                </Link>
              )}
              <span className="px-4 py-2 bg-gray-100">
                Pagina {page} van {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/blogs?page=${page + 1}${
                    category ? `&category=${category}` : ""
                  }`}
                  className="px-4 py-2 bg-gray-200 rounded-r"
                >
                  Volgende
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
