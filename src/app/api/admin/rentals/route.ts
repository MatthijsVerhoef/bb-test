import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          renter: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          trailer: {
            title: { contains: search, mode: "insensitive" },
          },
        },
        {
          id: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // Get total count
    const totalCount = await prisma.rental.count({ where });

    // Get rentals with relations
    const rentals = await prisma.rental.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            phone: true,
          },
        },
        lessor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        trailer: {
          select: {
            id: true,
            title: true,
            type: true,
            licensePlate: true,
            pricePerDay: true,
            images: {
              take: 1,
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentMethod: true,
          },
        },
        damageReports: {
          select: {
            id: true,
            damageStatus: true,
            repairCost: true,
            resolved: true,
          },
        },
        insuranceClaims: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    // Calculate some statistics
    const stats = await prisma.rental.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      rentals,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching rentals:", error);
    return NextResponse.json(
      { error: "Failed to fetch rentals" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rentalId, action, data } = body;

    if (!rentalId || !action) {
      return NextResponse.json(
        { error: "Missing rentalId or action" },
        { status: 400 }
      );
    }

    // Get the rental first
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        renter: true,
        lessor: true,
        trailer: true,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: "Rental not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let notificationMessage = "";

    switch (action) {
      case "UPDATE_STATUS":
        if (!data.status) {
          return NextResponse.json(
            { error: "Missing status" },
            { status: 400 }
          );
        }
        updateData.status = data.status;
        
        // Handle status-specific updates
        if (data.status === "CANCELLED" && data.cancellationReason) {
          updateData.cancellationReason = data.cancellationReason;
          updateData.cancellationDate = new Date();
        }
        
        if (data.status === "COMPLETED") {
          updateData.actualReturnDate = data.actualReturnDate || new Date();
        }

        notificationMessage = `Your rental for ${rental.trailer.title} has been ${data.status.toLowerCase()}`;
        break;

      case "UPDATE_DATES":
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        if (data.pickupTime) updateData.pickupTime = new Date(data.pickupTime);
        if (data.returnTime) updateData.returnTime = new Date(data.returnTime);
        
        notificationMessage = `The dates for your rental of ${rental.trailer.title} have been updated`;
        break;

      case "UPDATE_PRICING":
        if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
        if (data.serviceFee !== undefined) updateData.serviceFee = data.serviceFee;
        if (data.insuranceFee !== undefined) updateData.insuranceFee = data.insuranceFee;
        if (data.deliveryFee !== undefined) updateData.deliveryFee = data.deliveryFee;
        if (data.securityDeposit !== undefined) updateData.securityDeposit = data.securityDeposit;
        if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount;
        
        notificationMessage = `The pricing for your rental of ${rental.trailer.title} has been updated`;
        break;

      case "ADD_NOTE":
        if (!data.note) {
          return NextResponse.json(
            { error: "Missing note" },
            { status: 400 }
          );
        }
        updateData.specialNotes = rental.specialNotes 
          ? `${rental.specialNotes}\n\n[Admin Note - ${new Date().toISOString()}]: ${data.note}`
          : `[Admin Note - ${new Date().toISOString()}]: ${data.note}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update the rental
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: updateData,
      include: {
        renter: true,
        lessor: true,
        trailer: true,
        payment: true,
      },
    });

    // Create notifications for both renter and lessor if status changed
    if (action === "UPDATE_STATUS" || action === "UPDATE_DATES" || action === "UPDATE_PRICING") {
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: rental.renterId,
            type: "BOOKING",
            message: notificationMessage,
            actionUrl: `/rentals/${rental.id}`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: rental.lessorId,
            type: "BOOKING",
            message: notificationMessage,
            actionUrl: `/rentals/${rental.id}`,
          },
        }),
      ]);
    }

    // Log the action
    await prisma.transactionLog.create({
      data: {
        type: "BOOKING",
        message: `Admin ${action} for rental ${rentalId}`,
        referenceId: rentalId,
        userId: session.user.id,
        amount: updateData.totalPrice,
      },
    });

    return NextResponse.json({
      success: true,
      rental: updatedRental,
    });
  } catch (error) {
    console.error("Error updating rental:", error);
    return NextResponse.json(
      { error: "Failed to update rental" },
      { status: 500 }
    );
  }
}

// Delete rental (soft delete by changing status)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rentalId = searchParams.get("id");

    if (!rentalId) {
      return NextResponse.json(
        { error: "Missing rental ID" },
        { status: 400 }
      );
    }

    // Instead of hard delete, cancel the rental
    const rental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: "CANCELLED",
        cancellationReason: "Cancelled by admin",
        cancellationDate: new Date(),
      },
    });

    // Create notifications
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: rental.renterId,
          type: "BOOKING",
          message: "Your rental has been cancelled by an administrator",
          actionUrl: `/rentals/${rental.id}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: rental.lessorId,
          type: "BOOKING",
          message: "A rental for your trailer has been cancelled by an administrator",
          actionUrl: `/rentals/${rental.id}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Rental cancelled successfully",
    });
  } catch (error) {
    console.error("Error deleting rental:", error);
    return NextResponse.json(
      { error: "Failed to delete rental" },
      { status: 500 }
    );
  }
}