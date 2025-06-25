import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all blogs with pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get('status');
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'publishedAt';
    const order = searchParams.get('order') || 'desc';
    
    // Build filters
    const where: any = {};
    
    // Filter by publication status
    if (status === 'published') {
      where.published = true;
    } else if (status === 'draft') {
      where.published = false;
    }
    
    // Filter by category
    if (categorySlug) {
      where.categories = {
        some: { slug: categorySlug }
      };
    }
    
    // Filter by search query
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count for pagination
    const totalItems = await prisma.blog.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get blogs
    const blogs = await prisma.blog.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        published: true,
        publishedAt: true,
        authorName: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new blog
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.slug || !data.content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug: data.slug },
    });
    
    if (existingBlog) {
      return NextResponse.json(
        { error: 'A blog with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Prepare data
    const blogData: any = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      published: Boolean(data.published),
      publishedAt: data.published ? new Date() : null,
      authorName: data.authorName || 'Admin',
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
    };
    
    // Create the blog
    const blog = await prisma.blog.create({
      data: {
        ...blogData,
        categories: {
          connect: (data.categories || []).map((cat: any) => ({ id: cat.id })),
        },
      },
      include: {
        categories: true,
      },
    });
    
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}