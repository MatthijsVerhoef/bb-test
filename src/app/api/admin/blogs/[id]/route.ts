import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Get a single blog by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    
    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Update a blog
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Check if blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
      include: { categories: true },
    });
    
    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!data.title || !data.slug || !data.content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists (but exclude the current blog)
    if (data.slug !== existingBlog.slug) {
      const slugCheck = await prisma.blog.findUnique({
        where: { slug: data.slug },
      });
      
      if (slugCheck) {
        return NextResponse.json(
          { error: 'A blog with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
    };
    
    // Handle publishing
    if (!existingBlog.published && data.published) {
      updateData.published = true;
      updateData.publishedAt = new Date();
    } else if (existingBlog.published && !data.published) {
      updateData.published = false;
    }
    
    // Update the blog
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...updateData,
        categories: {
          disconnect: existingBlog.categories.map(cat => ({ id: cat.id })),
          connect: (data.categories || []).map((cat: any) => ({ id: cat.id })),
        },
      },
      include: {
        categories: true,
      },
    });
    
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a blog
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });
    
    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Delete the blog
    await prisma.blog.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}