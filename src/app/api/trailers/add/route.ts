// app/api/trailers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the availability schema to accept the format from frontend
const availabilityDaySchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  // Frontend sends morning/afternoon/evening format
  morning: z.boolean().optional(),
  afternoon: z.boolean().optional(),
  evening: z.boolean().optional(),
  morningStart: z.string().optional(),
  morningEnd: z.string().optional(),
  afternoonStart: z.string().optional(),
  afternoonEnd: z.string().optional(),
  eveningStart: z.string().optional(),
  eveningEnd: z.string().optional(),
  // Or it might send the timeSlot format
  available: z.boolean().optional(),
  timeSlot1Start: z.string().nullable().optional(),
  timeSlot1End: z.string().nullable().optional(),
  timeSlot2Start: z.string().nullable().optional(),
  timeSlot2End: z.string().nullable().optional(),
  timeSlot3Start: z.string().nullable().optional(),
  timeSlot3End: z.string().nullable().optional(),
});

// Define the TrailerType enum to match the Prisma schema
const TrailerTypeEnum = z.enum([
  "OPEN_AANHANGER",
  "GESLOTEN_AANHANGER",
  "AUTOTRANSPORTER",
  "PAARDENTRAILER",
  "BOOTTRAILER",
  "KIPPER",
  "MOTORFIETS_AANHANGER",
  "FLATBED_AANHANGER",
  "BAGAGE_AANHANGER",
  "VERKOOPWAGEN", 
  "FIETSEN_AANHANGER",
  "SCHAMEL_AANHANGERS",
  "PLATEAUWAGENS",
  "OVERIG"
]);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om een aanhanger te plaatsen" },
        { status: 401 }
      );
    }

    // Ensure user is verified
    const user = session.user;

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Je account moet geverifieerd zijn om een aanhanger te plaatsen" },
        { status: 403 }
      );
    }

    // Always upgrade to LESSOR role when adding a trailer (unless already ADMIN)
    if (user.role !== "ADMIN") {
      // Automatically upgrade to LESSOR role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "LESSOR" }
      });
      
      console.log(`User ${user.id} role updated to LESSOR`);
      
      // Update session user role to LESSOR (will be reflected on next auth check)
      user.role = "LESSOR";
    }

    // Parse and validate request body
    const data = await req.json();

    // Define trailer schema using zod
    const trailerSchema = z.object({
      title: z.string().min(5),
      description: z.string().min(20),
      pricePerDay: z.number().min(1),
      pricePerWeek: z.number().optional(),
      pricePerMonth: z.number().optional(),
      securityDeposit: z.number().optional(),
      cancellationPolicy: z.string().optional(),
      minRentalDuration: z.number().min(1),
      maxRentalDuration: z.number().optional(),
      address: z.string().min(3),
      city: z.string().min(2),
      postalCode: z.string().min(4),
      country: z.string().min(2),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
      type: TrailerTypeEnum, // Use the enum to validate the type
      categoryId: z.string().optional(),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      licensePlate: z.string().optional(),
      vinNumber: z.string().optional(),
      weight: z.number().nullable().optional(),
      length: z.number().nullable().optional(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
      capacity: z.number().nullable().optional(),
      axles: z.number().nullable().optional(),
      brakes: z.boolean().optional(),
      towBallWeight: z.number().nullable().optional(),
      maxSpeed: z.number().nullable().optional(),
      features: z.string().or(z.array(z.string())),
      requiresDriversLicense: z.boolean().default(false),
      includesInsurance: z.boolean().default(false),
      homeDelivery: z.boolean().default(false),
      deliveryFee: z.number().nullable().optional(),
      maxDeliveryDistance: z.number().nullable().optional(),
      instructions: z.string().optional(),
      images: z.array(
        z.object({
          url: z.string()
        })
      ).optional(),
      // Add the availability schema to accept the new format
      availability: z.array(availabilityDaySchema).optional(),
      weeklyAvailability: z.array(availabilityDaySchema).optional() // Also accept this format
    });

    const validatedData = trailerSchema.parse(data);

    // Prepare features as JSON
    let featuresJson: any = {};
    if (typeof validatedData.features === "string") {
      try {
        featuresJson = JSON.parse(validatedData.features);
      } catch (e) {
        // If parsing fails, use as-is (might be an array of strings)
        featuresJson = { [validatedData.features]: true };
      }
    } else if (Array.isArray(validatedData.features)) {
      // Convert array of feature keys to object with boolean values
      validatedData.features.forEach(feature => {
        featuresJson[feature] = true;
      });
    }

    // Prepare the base data for trailer creation
    const trailerData: any = {
      title: validatedData.title,
      description: validatedData.description,
      pricePerDay: validatedData.pricePerDay,
      pricePerWeek: validatedData.pricePerWeek,
      pricePerMonth: validatedData.pricePerMonth,
      securityDeposit: validatedData.securityDeposit,
      available: true,
      location: `${validatedData.city}, ${validatedData.postalCode}`, // Combined location string
      address: validatedData.address,
      city: validatedData.city,
      postalCode: validatedData.postalCode,
      country: validatedData.country,
      latitude: validatedData.latitude || null, 
      longitude: validatedData.longitude || null,
      licensePlate: validatedData.licensePlate,
      cancellationPolicy: validatedData.cancellationPolicy,
      maxRentalDuration: validatedData.maxRentalDuration,
      minRentalDuration: validatedData.minRentalDuration,
      features: featuresJson,
      requiresDriversLicense: validatedData.requiresDriversLicense,
      includesInsurance: validatedData.includesInsurance,
      homeDelivery: validatedData.homeDelivery,
      deliveryFee: validatedData.deliveryFee,
      maxDeliveryDistance: validatedData.maxDeliveryDistance,
      instructions: validatedData.instructions,
      type: validatedData.type,
      manufacturer: validatedData.manufacturer,
      model: validatedData.model,
      year: validatedData.year,
      weight: validatedData.weight,
      length: validatedData.length,
      width: validatedData.width,
      height: validatedData.height,
      capacity: validatedData.capacity,
      axles: validatedData.axles,
      brakes: validatedData.brakes,
      towBallWeight: validatedData.towBallWeight,
      maxSpeed: validatedData.maxSpeed,
      vinNumber: validatedData.vinNumber,
      owner: {
        connect: {
          id: user.id
        }
      }
    };
    
    // Only add category connection if a valid categoryId is provided
    // This avoids using the default value which might not exist
    if (validatedData.categoryId && validatedData.categoryId !== "default-category") {
      // Check if category exists before attempting to connect
      const categoryExists = await prisma.trailerCategory.findUnique({
        where: { id: validatedData.categoryId },
        select: { id: true }
      });
      
      if (categoryExists) {
        trailerData.category = {
          connect: { id: validatedData.categoryId }
        };
      }
    }
    
    // Create the trailer with the prepared data
    const trailer = await prisma.trailer.create({
      data: trailerData
    });

    // Add images if provided
    if (validatedData.images && validatedData.images.length > 0) {
      console.log("Processing images:", JSON.stringify(validatedData.images));
      
      // Filter out any images that might have problematic URLs
      const validImages = validatedData.images.filter(image => {
        const url = image.url || '';
        // Check if URL is valid and doesn't point to problematic domains
        if (!url || url.includes('ornate-bookcase.com')) {
          console.warn(`Skipping invalid or problematic image URL: ${url}`);
          return false;
        }
        return true;
      });
      
      if (validImages.length > 0) {
        try {
          await prisma.media.createMany({
            data: validImages.map((image, index) => ({
              url: image.url,
              type: "IMAGE",
              order: index,
              trailerId: trailer.id
            }))
          });
          console.log(`Successfully added ${validImages.length} images`);
        } catch (error) {
          console.error("Error adding images:", error);
          // Continue with trailer creation even if image upload fails
        }
      } else {
        console.log("No valid images to add");
      }
    }

    // Handle availability data - convert from frontend format to database format
    const availabilityData = validatedData.weeklyAvailability || validatedData.availability;
    
    if (availabilityData && availabilityData.length > 0) {
      // Convert the frontend format (morning/afternoon/evening) to database format (timeSlots)
      const convertedAvailability = availabilityData.map(day => {
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
            trailerId: trailer.id
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
          trailerId: trailer.id
        };
      });
      
      await prisma.weeklyAvailability.createMany({
        data: convertedAvailability
      });
    } else {
      // Fallback to default availability if none provided
      const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      
      // We'll create a more realistic default where weekdays have 8:00-20:00 availability
      // and weekends have 10:00-18:00 availability
      await prisma.weeklyAvailability.createMany({
        data: daysOfWeek.map(day => {
          const isWeekend = day === "SATURDAY" || day === "SUNDAY";
          return {
            day,
            available: true,
            timeSlot1Start: isWeekend ? "10:00" : "08:00",
            timeSlot1End: isWeekend ? "18:00" : "20:00",
            timeSlot2Start: null,
            timeSlot2End: null,
            timeSlot3Start: null,
            timeSlot3End: null,
            trailerId: trailer.id
          };
        })
      });
    }

    // Create notification for the owner
    await prisma.notification.create({
      data: {
        message: `Je aanhanger "${trailer.title}" is succesvol geplaatst!`,
        type: "SYSTEM",
        actionUrl: `/trailers/${trailer.id}`,
        userId: user.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Aanhanger succesvol geplaatst",
      trailer: { 
        id: trailer.id,
        title: trailer.title 
      }
    });
  } catch (error) {
    console.error("Error creating trailer:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validatiefout", 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het plaatsen van je aanhanger" },
      { status: 500 }
    );
  }
}

// Make sure OPTIONS method is defined for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// Define allowed HTTP methods for this route
export const dynamic = 'force-dynamic';