// src/app/api/admin/rentals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const lessorId = url.searchParams.get('lessorId');
    const renterId = url.searchParams.get('renterId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sort = url.searchParams.get('sort') || 'createdAt';
    const order = url.searchParams.get('order') || 'desc';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (lessorId) {
      where.lessorId = lessorId;
    }
    
    if (renterId) {
      where.renterId = renterId;
    }
    
    // Count total rentals matching filters
    const totalCount = await prisma.rental.count({ where });
    
    // Fetch rentals with related data
    const rentals = await prisma.rental.findMany({
      where,
      include: {
        trailer: {
          select: {
            id: true,
            title: true,
            type: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            images: {
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });
    
    // Return formatted rentals with pagination info
    return NextResponse.json({
      rentals: rentals.map(rental => ({
        id: rental.id,
        status: rental.status,
        startDate: rental.startDate,
        endDate: rental.endDate,
        createdAt: rental.createdAt,
        totalPrice: rental.totalPrice,
        cancellationReason: rental.cancellationReason,
        paymentStatus: rental.payment?.status || 'NO_PAYMENT',
        paymentAmount: rental.payment?.amount || 0,
        trailer: {
          id: rental.trailer.id,
          title: rental.trailer.title,
          type: rental.trailer.type,
          imageUrl: rental.trailer.images[0]?.url,
        },
        lessor: {
          id: rental.lessorId,
          name: `${rental.trailer.owner.firstName || ''} ${rental.trailer.owner.lastName || ''}`.trim(),
          email: rental.trailer.owner.email,
          phone: rental.trailer.owner.phone,
        },
        renter: {
          id: rental.renterId,
          name: `${rental.renter.firstName || ''} ${rental.renter.lastName || ''}`.trim(),
          email: rental.renter.email,
          phone: rental.renter.phone,
        },
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching admin rentals:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rental data' },
      { status: 500 }
    );
  }
}