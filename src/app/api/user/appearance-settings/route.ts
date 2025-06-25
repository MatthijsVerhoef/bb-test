// app/api/user/appearance-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema
const appearanceSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "default", "large"]),
  colorScheme: z.enum([
    "default",
    "blue",
    "green",
    "purple",
    "pink",
    "red",
    "yellow",
    "cyan",
    "indigo",
    "orange",
  ]),
  reduceMotion: z.boolean().default(false),
  reduceTransparency: z.boolean().default(false),
  highContrast: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user preference from database
    const preference = await prisma.userPreference.findUnique({
      where: {
        userId: session.user.id as string,
      },
    });
    
    // Return all appearance settings
    // First check if the appearanceSettings field exists
    let appearanceSettings = {};
    
    if (preference?.appearanceSettings) {
      // If the field exists, parse the JSON
      try {
        appearanceSettings = JSON.parse(preference.appearanceSettings as string);
      } catch (e) {
        console.error("Error parsing appearanceSettings:", e);
      }
    }
    
    // Default appearance settings
    const defaultSettings = {
      theme: preference?.darkMode ? "dark" : "light",
      fontSize: "default",
      colorScheme: "default",
      reduceMotion: false,
      reduceTransparency: false,
      highContrast: false,
      // Override defaults with any saved settings
      ...appearanceSettings
    };
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error("Error fetching appearance settings:", error);
    return NextResponse.json(
      { error: "Error fetching appearance settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    const validationResult = appearanceSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Check if user preference exists
    const existingPreference = await prisma.userPreference.findUnique({
      where: {
        userId: session.user.id as string,
      },
    });
    
    // Store all appearance settings except theme as JSON
    const appearanceSettingsJson = JSON.stringify({
      fontSize: validatedData.fontSize,
      colorScheme: validatedData.colorScheme,
      reduceMotion: validatedData.reduceMotion,
      reduceTransparency: validatedData.reduceTransparency,
      highContrast: validatedData.highContrast,
    });
    
    // Update or create user preference
    if (existingPreference) {
      await prisma.userPreference.update({
        where: {
          userId: session.user.id as string,
        },
        data: {
          darkMode: validatedData.theme === "dark",
          appearanceSettings: appearanceSettingsJson,
        },
      });
    } else {
      await prisma.userPreference.create({
        data: {
          userId: session.user.id as string,
          darkMode: validatedData.theme === "dark",
          appearanceSettings: appearanceSettingsJson,
        },
      });
    }
    
    return NextResponse.json({
      message: "Appearance settings updated successfully",
      settings: validatedData // Return the updated settings in the response
    });
  } catch (error) {
    console.error("Error updating appearance settings:", error);
    return NextResponse.json(
      { error: "Error updating appearance settings" },
      { status: 500 }
    );
  }
}