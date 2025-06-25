import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all blog categories
export async function GET() {
  try {
    const categories = await prisma.blogCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Map the categories to include post count
    const mappedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      postCount: category._count.posts,
    }));
    
    return NextResponse.json(mappedCategories);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new blog category
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { slug: data.slug },
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Create the category
    const category = await prisma.blogCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
      },
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating blog category:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}