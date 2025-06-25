// app/api/user/profile/reviews/[id]/respond/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Add or update a response to a review (for lessors)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const reviewId = params.id;
    
    // Get response text from request body
    const { response } = await request.json();
    
    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }
    
    // OPTIMIZATION: Use transaction to validate and update in one go
    const result = await prisma.$transaction(async (tx) => {
      // First get the review and trailer in one query
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          trailer: {
            select: {
              ownerId: true
            }
          }
        }
      });
      
      if (!review) {
        return { status: 404, error: 'Review not found' };
      }
      
      // Verify that the authenticated user is the trailer owner
      if (review.trailer.ownerId !== session.user.id) {
        return { status: 403, error: 'You are not authorized to respond to this review' };
      }
      
      // Add or update the response
      const updatedReview = await tx.review.update({
        where: {
          id: reviewId
        },
        data: {
          response: response.trim(),
          responseDate: new Date() // Set the response date to now
        }
      });
      
      return { status: 200, review: updatedReview };
    });
    
    // Handle different response scenarios
    if (result.status !== 200) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      review: result.review
    });
    
  } catch (error) {
    console.error('Error responding to review:', error);
    return NextResponse.json(
      { error: 'Failed to respond to review' },
      { status: 500 }
    );
  }
}

// Remove a response from a review (for lessors)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const reviewId = params.id;
    
    // OPTIMIZATION: Use transaction to validate and update in one go
    const result = await prisma.$transaction(async (tx) => {
      // First get the review and trailer in one query
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          trailer: {
            select: {
              ownerId: true
            }
          }
        }
      });
      
      if (!review) {
        return { status: 404, error: 'Review not found' };
      }
      
      // Verify that the authenticated user is the trailer owner
      if (review.trailer.ownerId !== session.user.id) {
        return { status: 403, error: 'You are not authorized to remove this response' };
      }
      
      // Remove the response
      const updatedReview = await tx.review.update({
        where: {
          id: reviewId
        },
        data: {
          response: null,
          responseDate: null
        }
      });
      
      return { status: 200, review: updatedReview };
    });
    
    // Handle different response scenarios
    if (result.status !== 200) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      review: result.review
    });
    
  } catch (error) {
    console.error('Error removing review response:', error);
    return NextResponse.json(
      { error: 'Failed to remove response' },
      { status: 500 }
    );
  }
}