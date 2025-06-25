// app/api/user/profile/renter-history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;
    
    // Build filter conditions - only rentals where the user is the renter
    const filter: any = {
      renterId: session.user.id,
    };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Use transaction to optimize queries and prevent N+1 problems
    const data = await prisma.$transaction(async (tx) => {
      // Get total count for pagination
      const totalCount = await tx.rental.count({
        where: filter,
      });
      
      // Fetch basic rental data first with minimal fields
      const rentals = await tx.rental.findMany({
        where: filter,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          totalPrice: true,
          serviceFee: true,
          insuranceFee: true,
          deliveryFee: true,
          securityDeposit: true,
          discountAmount: true,
          pickupLocation: true,
          returnLocation: true,
          pickupTime: true,
          returnTime: true,
          actualReturnDate: true,
          needsDelivery: true,
          cancellationReason: true,
          cancellationDate: true,
          specialNotes: true,
          termsAccepted: true,
          trailerId: true,
          renterId: true,
          lessorId: true,
          couponId: true,
          insuranceId: true,
        },
        orderBy: {
          startDate: 'desc'
        },
        take: limit,
        skip: offset,
      });
      
      if (rentals.length === 0) {
        return { rentals: [], totalCount };
      }
      
      // Extract IDs for batch fetching related data
      const rentalIds = rentals.map(r => r.id);
      const trailerIds = [...new Set(rentals.map(r => r.trailerId))];
      const lessorIds = [...new Set(rentals.map(r => r.lessorId).filter(Boolean))];
      const insuranceIds = rentals
        .map(r => r.insuranceId)
        .filter(Boolean) as string[];
      
      // Batch fetch all related data in parallel
      const [
        trailers,
        media,
        lessors,
        payments,
        damageReports,
        insuranceClaims,
        pickupItems,
        returnItems,
        extensions,
        insurances
      ] = await Promise.all([
        // Fetch all relevant trailers
        tx.trailer.findMany({
          where: { id: { in: trailerIds } },
        }),
        
        // Fetch trailer images
        tx.media.findMany({
          where: { trailerId: { in: trailerIds } },
          select: {
            id: true,
            url: true,
            type: true,
            title: true,
            description: true,
            size: true,
            order: true,
            createdAt: true,
            trailerId: true
          },
          orderBy: { order: 'asc' }
        }),
        
        // Fetch lessor information
        tx.user.findMany({
          where: { id: { in: lessorIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true
          },
        }),
        
        // Fetch related payments
        tx.payment.findMany({
          where: { rentalId: { in: rentalIds } },
        }),
        
        // Fetch related damage reports
        tx.damageReport.findMany({
          where: { rentalId: { in: rentalIds } },
        }),
        
        // Fetch related insurance claims
        tx.insuranceClaim.findMany({
          where: { rentalId: { in: rentalIds } },
        }),
        
        // Fetch related pickup checklist items
        tx.rentalChecklistItem.findMany({
          where: { pickupRentalId: { in: rentalIds } },
        }),
        
        // Fetch related return checklist items
        tx.rentalChecklistItem.findMany({
          where: { returnRentalId: { in: rentalIds } },
        }),
        
        // Fetch related rental extensions
        tx.rentalExtension.findMany({
          where: { rentalId: { in: rentalIds } },
        }),
        
        // Fetch related insurance policies
        tx.insurance.findMany({
          where: { id: { in: insuranceIds } },
        })
      ]);
      
      // Create lookup objects for fast access
      const trailerMap = trailers.reduce((map, trailer) => {
        map[trailer.id] = trailer;
        return map;
      }, {} as Record<string, typeof trailers[0]>);
      
      const lessorMap = lessors.reduce((map, lessor) => {
        map[lessor.id] = lessor;
        return map;
      }, {} as Record<string, typeof lessors[0]>);
      
      const paymentMap = payments.reduce((map, payment) => {
        map[payment.rentalId] = payment;
        return map;
      }, {} as Record<string, typeof payments[0]>);
      
      const insuranceMap = insurances.reduce((map, insurance) => {
        map[insurance.id] = insurance;
        return map;
      }, {} as Record<string, typeof insurances[0]>);
      
      // Group items by trailer/rental IDs
      const trailerImagesMap = media.reduce((map, image) => {
        if (!map[image.trailerId]) map[image.trailerId] = [];
        map[image.trailerId].push(image);
        return map;
      }, {} as Record<string, typeof media>);
      
      const damageReportsMap = damageReports.reduce((map, report) => {
        if (!map[report.rentalId || '']) map[report.rentalId || ''] = [];
        map[report.rentalId || ''].push(report);
        return map;
      }, {} as Record<string, typeof damageReports>);
      
      const insuranceClaimsMap = insuranceClaims.reduce((map, claim) => {
        if (!map[claim.rentalId || '']) map[claim.rentalId || ''] = [];
        map[claim.rentalId || ''].push(claim);
        return map;
      }, {} as Record<string, typeof insuranceClaims>);
      
      const pickupItemsMap = pickupItems.reduce((map, item) => {
        if (!map[item.pickupRentalId || '']) map[item.pickupRentalId || ''] = [];
        map[item.pickupRentalId || ''].push(item);
        return map;
      }, {} as Record<string, typeof pickupItems>);
      
      const returnItemsMap = returnItems.reduce((map, item) => {
        if (!map[item.returnRentalId || '']) map[item.returnRentalId || ''] = [];
        map[item.returnRentalId || ''].push(item);
        return map;
      }, {} as Record<string, typeof returnItems>);
      
      const extensionsMap = extensions.reduce((map, extension) => {
        if (!map[extension.rentalId]) map[extension.rentalId] = [];
        map[extension.rentalId].push(extension);
        return map;
      }, {} as Record<string, typeof extensions>);
      
      return {
        rentals,
        totalCount,
        trailerMap,
        trailerImagesMap,
        lessorMap,
        paymentMap,
        damageReportsMap,
        insuranceClaimsMap,
        pickupItemsMap,
        returnItemsMap,
        extensionsMap,
        insuranceMap
      };
    });
    
    // Exit early if there are no rentals
    if (data.rentals.length === 0) {
      return NextResponse.json({
        rentals: [],
        pagination: {
          total: data.totalCount,
          page,
          limit,
          pages: Math.ceil(data.totalCount / limit),
        },
      });
    }
    
    // Format the results using the lookup maps to reconstruct relationships
    const formattedRentals = data.rentals.map(rental => {
      const trailer = data.trailerMap[rental.trailerId];
      const trailerImages = data.trailerImagesMap[rental.trailerId] || [];
      const lessor = rental.lessorId ? data.lessorMap[rental.lessorId] : null;
      const payment = data.paymentMap[rental.id];
      const damageReports = data.damageReportsMap[rental.id] || [];
      const insuranceClaims = data.insuranceClaimsMap[rental.id] || [];
      const pickupChecklist = data.pickupItemsMap[rental.id] || [];
      const returnChecklist = data.returnItemsMap[rental.id] || [];
      const rentalExtensions = data.extensionsMap[rental.id] || [];
      const insurancePolicy = rental.insuranceId ? data.insuranceMap[rental.insuranceId] : null;
      
      return {
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        totalPrice: rental.totalPrice,
        trailerId: rental.trailerId,
        trailerTitle: trailer?.title || 'Unknown Trailer',
        trailerImage: trailerImages[0]?.url || null,
        pickupLocation: rental.pickupLocation,
        dropoffLocation: rental.returnLocation,
        lessor: lessor ? {
          id: lessor.id,
          firstName: lessor.firstName || '',
          lastName: lessor.lastName || '',
          phoneNumber: lessor.phone,
          email: lessor.email,
          profilePicture: lessor.profilePicture
        } : null,
        serviceFee: rental.serviceFee,
        insuranceFee: rental.insuranceFee,
        deliveryFee: rental.deliveryFee,
        securityDeposit: rental.securityDeposit,
        actualReturnDate: rental.actualReturnDate,
        needsDelivery: rental.needsDelivery,
        specialNotes: rental.specialNotes,
        cancellationReason: rental.cancellationReason,
        cancellationDate: rental.cancellationDate,
        payment,
        damageReports,
        insuranceClaims,
        pickupChecklist,
        returnChecklist,
        rentalExtensions,
        insurancePolicy,
        trailer: {
          ...trailer,
          images: trailerImages
        },
        renterId: rental.renterId,
        lessorId: rental.lessorId,
        discountAmount: rental.discountAmount,
        couponCode: null // We don't fetch coupon information in this optimized version
      };
    });
    
    // Add cache control headers to prevent duplicate requests
    return NextResponse.json(
      {
        rentals: formattedRentals,
        pagination: {
          total: data.totalCount,
          page,
          limit,
          pages: Math.ceil(data.totalCount / limit),
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        }
      }
    );
    
  } catch (error) {
    console.error('Error fetching renter rental history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental history' },
      { status: 500 }
    );
  }
}