import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Blog slug is required' },
        { status: 400 }
      );
    }

    // Fetch the blog by slug
    const blog = await prisma.blog.findUnique({
      where: {
        slug
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        }
      }
    });

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if the blog is published
    if (!blog.published) {
      // Optionally check for authentication/authorization here
      // For example, only admin users can view unpublished blogs
      
      // For now, simply return a 404 for unpublished blogs
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Fetch related blogs from the same category (limited to 3)
    const relatedBlogs = await prisma.blog.findMany({
      where: {
        id: { not: blog.id },
        published: true,
        categories: {
          some: {
            id: { in: blog.categories.map(category => category.id) }
          }
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 3
    });

    return NextResponse.json({
      data: {
        ...blog,
        relatedBlogs
      }
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}