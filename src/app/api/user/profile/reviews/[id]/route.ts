// app/api/user/profile/reviews/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

// Cache headers for single review responses
const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
};

// Get single review
export async function GET(
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
    
    // Generate cache key based on review ID and user
    const cacheKey = createHash('md5')
      .update(`${session.user.id}-review-${reviewId}`)
      .digest('hex');
    
    // OPTIMIZATION: Use a transaction to batch queries
    const data = await prisma.$transaction(async (tx) => {
      // First, get the basic review data
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          response: true,
          responseDate: true,
          createdAt: true,
          updatedAt: true,
          cleanliness: true,
          maintenance: true,
          valueForMoney: true,
          communication: true,
          accuracy: true,
          recommended: true,
          reviewerId: true,
          trailerId: true
        }
      });
      
      if (!review) {
        return null;
      }
      
      // Get trailer with minimal data to check ownership
      const trailer = await tx.trailer.findUnique({
        where: { id: review.trailerId },
        select: {
          id: true,
          title: true,
          ownerId: true
        }
      });
      
      if (!trailer) {
        return { review, isAuthorized: false };
      }
      
      // Check authorization
      const isReviewer = review.reviewerId === session.user.id;
      const isTrailerOwner = trailer.ownerId === session.user.id;
      
      if (!isReviewer && !isTrailerOwner) {
        return { review, trailer, isAuthorized: false };
      }
      
      // Define safe query functions
      const getReviewer = async () => {
        if (!isTrailerOwner) {
          return null;
        }
        return tx.user.findUnique({
          where: { id: review.reviewerId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        });
      };
      
      const getTrailerImage = async () => {
        return tx.media.findFirst({
          where: {
            trailerId: review.trailerId,
            type: 'IMAGE'
          },
          orderBy: { order: 'asc' },
          select: {
            url: true
          }
        });
      };
      
      // Get remaining related data in parallel using our safe query functions
      const [reviewer, trailerImage] = await Promise.all([
        getReviewer(),
        getTrailerImage()
      ]);
      
      return {
        review,
        trailer,
        reviewer,
        trailerImage,
        isAuthorized: true
      };
    });
    
    // Handle authorization and not found cases
    if (!data) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    if (!data.isAuthorized) {
      return NextResponse.json(
        { error: 'You are not authorized to view this review' },
        { status: 403 }
      );
    }
    
    // Format the review data
    const formattedReview = {
      id: data.review.id,
      rating: data.review.rating,
      title: data.review.title,
      comment: data.review.comment,
      response: data.review.response,
      responseDate: data.review.responseDate,
      createdAt: data.review.createdAt,
      updatedAt: data.review.updatedAt,
      cleanliness: data.review.cleanliness,
      maintenance: data.review.maintenance,
      valueForMoney: data.review.valueForMoney,
      communication: data.review.communication,
      accuracy: data.review.accuracy,
      recommended: data.review.recommended,
      reviewerId: data.review.reviewerId,
      reviewerName: data.reviewer
        ? `${data.reviewer.firstName || ''} ${data.reviewer.lastName || ''}`.trim()
        : null,
      reviewerImage: data.reviewer?.profilePicture || null,
      trailerId: data.trailer.id,
      trailerTitle: data.trailer.title,
      trailerImage: data.trailerImage?.url || null
    };
    
    // Return response with cache headers
    return NextResponse.json(
      { review: formattedReview },
      {
        headers: {
          ...CACHE_CONTROL_HEADERS,
          'X-Cache-Key': cacheKey
        }
      }
    );
    
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// Update a review (edit)
export async function PATCH(
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
    
    // Verify the review exists and belongs to the user
    const existingReview = await prisma.review.findUnique({
      where: {
        id: reviewId
      },
      select: {
        reviewerId: true,
        createdAt: true
      }
    });
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    if (existingReview.reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this review' },
        { status: 403 }
      );
    }
    
    // Check if the review is editable (within 30 days of creation)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (existingReview.createdAt < thirtyDaysAgo) {
      return NextResponse.json(
        { error: 'This review can no longer be edited (older than 30 days)' },
        { status: 400 }
      );
    }
    
    // Get update data from request body
    const data = await request.json();
    
    // Validate input data
    if (typeof data.rating !== 'undefined' && (data.rating < 1 || data.rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    if (typeof data.comment !== 'undefined' && (!data.comment || data.comment.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }
    
    // Only allow updating specific fields
    const allowedFields = [
      'rating',
      'title',
      'comment',
      'cleanliness',
      'maintenance',
      'valueForMoney',
      'communication',
      'accuracy',
      'recommended'
    ];
    
    const updateData: any = {};
    
    allowedFields.forEach(field => {
      if (field in data) {
        updateData[field] = data[field];
      }
    });
    
    // Update the review
    const updatedReview = await prisma.review.update({
      where: {
        id: reviewId
      },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      review: updatedReview
    });
    
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// Delete a review
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
    
    // Verify the review exists and belongs to the user
    const existingReview = await prisma.review.findUnique({
      where: {
        id: reviewId
      },
      select: {
        reviewerId: true
      }
    });
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    if (existingReview.reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this review' },
        { status: 403 }
      );
    }
    
    // Delete the review
    await prisma.review.delete({
      where: {
        id: reviewId
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}