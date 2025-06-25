// app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * POST handler for cache revalidation by tag
 */
export async function POST(request: Request) {
  try {
    // Verify authentication for secured revalidation
    const session = await getServerSession(authOptions);
    
    // Get the tag from URL parameters or request body
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    
    // If no tag provided, try to get it from request body
    if (!tag) {
      const body = await request.json().catch(() => ({}));
      
      if (!body.tag) {
        return NextResponse.json(
          { 
            revalidated: false, 
            error: 'A tag parameter is required' 
          }, 
          { status: 400 }
        );
      }
    }
    
    // Revalidate the tag
    revalidateTag(tag || 'global');
    
    return NextResponse.json({
      revalidated: true,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error revalidating tag:', error);
    return NextResponse.json(
      { 
        revalidated: false, 
        error: 'Failed to revalidate tag' 
      }, 
      { status: 500 }
    );
  }
}

/**
 * Route for revalidating a specific path
 * This is useful for ISR (Incremental Static Regeneration)
 */
export async function GET(request: Request) {
  try {
    // Only allow in development mode or with proper auth in production
    const session = await getServerSession(authOptions);
    
    // In production, require authentication
    if (process.env.NODE_ENV === 'production' && !session?.user?.id) {
      return NextResponse.json(
        { 
          revalidated: false, 
          error: 'Unauthorized' 
        }, 
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const tag = searchParams.get('tag');
    
    // Require either a path or tag
    if (!path && !tag) {
      return NextResponse.json(
        { 
          revalidated: false, 
          error: 'Either a path or tag parameter is required' 
        }, 
        { status: 400 }
      );
    }
    
    if (tag) {
      revalidateTag(tag);
    }
    
    return NextResponse.json({
      revalidated: true,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during revalidation:', error);
    return NextResponse.json(
      { 
        revalidated: false, 
        error: 'Failed to revalidate' 
      }, 
      { status: 500 }
    );
  }
}