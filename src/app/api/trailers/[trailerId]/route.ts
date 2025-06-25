import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapTrailerTypeToEnum } from "@/lib/trailer-type-mapper";

/**
 * GET: Fetch a single trailer by ID
 */
export async function GET(request: Request, { params }: { params: { trailerId: string } }) {
  try {
    // Await the params object first
    const { trailerId } = await params;
    
    // Use getServerSession with the authOptions from your auth.ts
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }
    
    // Get the trailer with owner info to verify ownership
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        images: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            url: true,
            title: true,
            order: true,
          },
        },
        accessories: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
        weeklyAvailability: {
          orderBy: {
            day: "asc",
          },
        },
        category: true,
      },
    });
    
    if (!trailer) {
      return NextResponse.json({ error: "Aanhanger niet gevonden" }, { status: 404 });
    }
    
    // Check if user is the owner of the trailer or an admin
    if (trailer.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Je hebt geen toegang tot deze aanhanger" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(trailer);
  } catch (error) {
    console.error("Error fetching trailer:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van de aanhanger" },
      { status: 500 }
    );
  }
}

/**
 * PUT/PATCH: Update a trailer
 * PUT is used for the full form update, PATCH for partial updates
 */
export async function PUT(request: Request, { params }: { params: { trailerId: string } }) {
  return updateTrailer(request, params);
}

export async function PATCH(request: Request, { params }: { params: { trailerId: string } }) {
  return updateTrailer(request, params);
}

async function updateTrailer(request: Request, params: { trailerId: string }) {
  try {
    // Await the params object first
    const { trailerId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Get the trailer to verify ownership
    const existingTrailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { ownerId: true },
    });
    
    if (!existingTrailer) {
      return NextResponse.json({ error: "Aanhanger niet gevonden" }, { status: 404 });
    }
    
    // Check if user is the owner
    if (existingTrailer.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Je hebt geen toegang om deze aanhanger te bewerken" },
        { status: 403 }
      );
    }
    
    // Prepare the update data
    const updateData: any = {};
    
    // Basic information
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type) updateData.type = mapTrailerTypeToEnum(data.type);
    
    // Location information
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    
    // Dimensions
    if (data.length !== undefined) updateData.length = data.length;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    
    // Options
    if (data.requiresDriversLicense !== undefined) 
      updateData.requiresDriversLicense = data.requiresDriversLicense;
    if (data.includesInsurance !== undefined) 
      updateData.includesInsurance = data.includesInsurance;
    if (data.homeDelivery !== undefined) 
      updateData.homeDelivery = data.homeDelivery;
    if (data.deliveryFee !== undefined) 
      updateData.deliveryFee = data.deliveryFee;
    if (data.maxDeliveryDistance !== undefined) 
      updateData.maxDeliveryDistance = data.maxDeliveryDistance;
    
    // Pricing
    if (data.pricePerDay !== undefined) updateData.pricePerDay = data.pricePerDay;
    if (data.pricePerWeek !== undefined) updateData.pricePerWeek = data.pricePerWeek;
    if (data.pricePerMonth !== undefined) updateData.pricePerMonth = data.pricePerMonth;
    if (data.securityDeposit !== undefined) updateData.securityDeposit = data.securityDeposit;
    
    // Rental policies
    if (data.cancellationPolicy !== undefined) updateData.cancellationPolicy = data.cancellationPolicy;
    if (data.minRentalDuration !== undefined) updateData.minRentalDuration = data.minRentalDuration;
    if (data.maxRentalDuration !== undefined) updateData.maxRentalDuration = data.maxRentalDuration;
    
    // Features
    if (data.features !== undefined) updateData.features = data.features;
    
    // Update the trailer in a transaction to handle related data
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update base trailer information
      const updatedTrailer = await tx.trailer.update({
        where: { id: trailerId },
        data: updateData,
      });
      
      // 2. Handle accessories if provided
      if (data.accessories && Array.isArray(data.accessories)) {
        // Delete current accessories
        await tx.accessory.deleteMany({
          where: { trailerId },
        });
        
        // Create new accessories
        if (data.accessories.length > 0) {
          await tx.accessory.createMany({
            data: data.accessories.map((acc: any) => ({
              name: acc.name,
              price: acc.price,
              description: acc.description,
              trailerId,
            })),
          });
        }
      }
      
      // 3. Handle weekly availability if provided
      const availabilityData = data.weeklyAvailability || data.availability;
      if (availabilityData && Array.isArray(availabilityData)) {
        // Delete current weekly availability
        await tx.weeklyAvailability.deleteMany({
          where: { trailerId },
        });
        
        // Create new weekly availability
        if (availabilityData.length > 0) {
          // Convert the frontend format (morning/afternoon/evening) to database format (timeSlots)
          const convertedAvailability = availabilityData.map((day: any) => {
            // Check if it's already in the correct format with timeSlot properties
            if ('timeSlot1Start' in day) {
              // Important: Respect the available flag exactly as provided by the frontend
              return {
                day: day.day,
                available: day.available !== undefined ? day.available : true,
                timeSlot1Start: day.available ? (day.timeSlot1Start || null) : null,
                timeSlot1End: day.available ? (day.timeSlot1End || null) : null,
                timeSlot2Start: day.available ? (day.timeSlot2Start || null) : null,
                timeSlot2End: day.available ? (day.timeSlot2End || null) : null,
                timeSlot3Start: day.available ? (day.timeSlot3Start || null) : null,
                timeSlot3End: day.available ? (day.timeSlot3End || null) : null,
                trailerId: trailerId
              };
            }
            
            // Convert from morning/afternoon/evening format
            const timeSlots = [];
            
            if (day.morning && day.morningStart && day.morningEnd) {
              timeSlots.push({ start: day.morningStart, end: day.morningEnd });
            }
            if (day.afternoon && day.afternoonStart && day.afternoonEnd) {
              timeSlots.push({ start: day.afternoonStart, end: day.afternoonEnd });
            }
            if (day.evening && day.eveningStart && day.eveningEnd) {
              timeSlots.push({ start: day.eveningStart, end: day.eveningEnd });
            }
            
            // If no time slots are active, the day is not available
            // But we should also check if 'available' is explicitly set to false
            let isAvailable = true;
            if (day.available === false) {
              isAvailable = false;
            } else {
              isAvailable = timeSlots.length > 0;
            }
            
            return {
              day: day.day,
              available: isAvailable,
              timeSlot1Start: isAvailable ? (timeSlots[0]?.start || null) : null,
              timeSlot1End: isAvailable ? (timeSlots[0]?.end || null) : null,
              timeSlot2Start: isAvailable ? (timeSlots[1]?.start || null) : null,
              timeSlot2End: isAvailable ? (timeSlots[1]?.end || null) : null,
              timeSlot3Start: isAvailable ? (timeSlots[2]?.start || null) : null,
              timeSlot3End: isAvailable ? (timeSlots[2]?.end || null) : null,
              trailerId: trailerId
            };
          });
          
          await tx.weeklyAvailability.createMany({
            data: convertedAvailability
          });
        }
      }
      
      // 4. Handle images if provided
      if (data.images && Array.isArray(data.images)) {
        // Delete current images
        await tx.media.deleteMany({
          where: { trailerId },
        });
        
        // Create new images
        if (data.images.length > 0) {
          await tx.media.createMany({
            data: data.images.map((img: any, index: number) => ({
              url: img.url,
              type: "IMAGE",
              order: index,
              trailerId,
            })),
          });
        }
      }
      
      return updatedTrailer;
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Aanhanger bijgewerkt",
      trailer: result
    });
  } catch (error) {
    console.error("Error updating trailer:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de aanhanger" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a trailer
 */
export async function DELETE(request: Request, { params }: { params: { trailerId: string } }) {
  try {
    // Await the params object first
    const { trailerId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }
    
    // Get the trailer to verify ownership
    const existingTrailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { 
        ownerId: true,
        rentals: {
          where: {
            status: { 
              in: ['PENDING', 'CONFIRMED', 'ACTIVE'] 
            }
          },
          select: { id: true }
        }
      },
    });
    
    if (!existingTrailer) {
      return NextResponse.json({ error: "Aanhanger niet gevonden" }, { status: 404 });
    }
    
    // Check if user is the owner
    if (existingTrailer.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Je hebt geen toegang om deze aanhanger te verwijderen" },
        { status: 403 }
      );
    }
    
    // Check if trailer has active rentals
    if (existingTrailer.rentals && existingTrailer.rentals.length > 0) {
      return NextResponse.json(
        { error: "Je kunt deze aanhanger niet verwijderen omdat er nog actieve boekingen zijn" },
        { status: 400 }
      );
    }
    
    // Delete trailer and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete accessories
      await tx.accessory.deleteMany({
        where: { trailerId },
      });
      
      // 2. Delete weekly availability
      await tx.weeklyAvailability.deleteMany({
        where: { trailerId },
      });
      
      // 3. Delete availability exceptions
      await tx.availabilityException.deleteMany({
        where: { trailerId },
      });
      
      // 4. Delete images (media)
      await tx.media.deleteMany({
        where: { trailerId },
      });
      
      // 5. Delete FAQs
      await tx.trailerFAQ.deleteMany({
        where: { trailerId },
      });
      
      // 6. Delete maintenance logs
      await tx.maintenanceLog.deleteMany({
        where: { trailerId },
      });
      
      // 7. Delete favorites
      await tx.favorite.deleteMany({
        where: { trailerId },
      });
      
      // 8. Delete reports
      await tx.report.deleteMany({
        where: { reportedTrailerId: trailerId },
      });
      
      // 9. Delete trailer
      await tx.trailer.delete({
        where: { id: trailerId },
      });
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Aanhanger verwijderd"
    });
  } catch (error) {
    console.error("Error deleting trailer:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van de aanhanger" },
      { status: 500 }
    );
  }
}