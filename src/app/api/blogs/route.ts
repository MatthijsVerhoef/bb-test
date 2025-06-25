import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category');
    const published = url.searchParams.get('published');

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    // Only show published blogs by default unless explicitly requested
    if (published !== null) {
      where.published = published === 'true';
    } else {
      where.published = true;
    }

    // Filter by category if provided
    if (category) {
      where.categories = {
        some: {
          slug: category
        }
      };
    }

    // Fetch blogs with their categories
    const blogs = await prisma.blog.findMany({
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
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalBlogs = await prisma.blog.count({ where });
    const totalPages = Math.ceil(totalBlogs / limit);

    return NextResponse.json({
      data: blogs,
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