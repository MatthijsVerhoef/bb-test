import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const publishedParam = searchParams.get('published');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    // Only filter by published status if explicitly provided
    if (publishedParam === 'true' || publishedParam === 'false') {
      where.published = publishedParam === 'true';
    }
    // If publishedParam is not provided, fetch all blogs (both published and unpublished)
    
    // Filter by category if provided
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }
    
    // Fetch blogs with their categories
    const [blogs, totalBlogs] = await Promise.all([
      prisma.blog.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          authorName: true,
          createdAt: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              }
            }
          },
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.blog.count({ where })
    ]);
    
    // Transform the data to flatten the category structure
    const transformedBlogs = blogs.map(blog => ({
      ...blog,
      categories: blog.categories.map(rel => rel.category)
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalBlogs / limit);
    
    return NextResponse.json({
      data: transformedBlogs,
      pagination: {
        total: totalBlogs,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}