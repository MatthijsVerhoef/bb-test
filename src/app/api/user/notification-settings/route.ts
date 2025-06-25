// src/app/api/user/notification-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema for the more flexible approach
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  settings: z.record(z.boolean()), // A record with string keys and boolean values for all individual settings
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user to check master notification toggles
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all detailed notification settings for this user
    const notificationSettings = await prisma.notificationSetting.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        settingKey: true,
        enabled: true,
      },
    });

    // Convert to the expected format (key-value pairs)
    const settingsMap = {};
    notificationSettings.forEach(setting => {
      settingsMap[setting.settingKey] = setting.enabled;
    });

    // Default values for any settings that don't exist yet
    const defaultSettings = {
      // Bookings
      "bookings:booking_request": true,
      "bookings:booking_confirmed": true,
      "bookings:booking_cancelled": true,
      "bookings:booking_modified": true,
      
      // Payments
      "payments:payment_received": true,
      "payments:payout_processed": true,
      "payments:payment_failed": true,
      
      // Messages
      "messages:new_message": true,
      "messages:unread_reminder": false,
      
      // Reminders
      "reminders:pickup_reminder": true,
      "reminders:return_reminder": true,
      "reminders:review_reminder": false,
      
      // Marketing
      "marketing:promotions": false,
      "marketing:newsletter": false,
      "marketing:new_features": true,
    };

    // Merge defaults with actual settings
    const settings = { ...defaultSettings, ...settingsMap };

    // Compose the response
    const response = {
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications || false,
      settings: settings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Error fetching notification settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body with the simplified schema
    const validationResult = notificationSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Start a transaction to ensure all updates happen together
    await prisma.$transaction(async (tx) => {
      // 1. Update master notification toggles in the User model
      await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          emailNotifications: validatedData.emailNotifications,
          pushNotifications: validatedData.pushNotifications,
        },
      });

      // 2. Delete all existing notification settings for this user
      await tx.notificationSetting.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // 3. Create new notification settings for each setting in the settings map
      const settingsToCreate = Object.entries(validatedData.settings).map(([key, value]) => ({
        userId: session.user.id,
        settingKey: key,
        enabled: value,
      }));

      // Use createMany to efficiently insert all settings at once
      await tx.notificationSetting.createMany({
        data: settingsToCreate,
      });
    });

    return NextResponse.json({
      message: "Notification settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Error updating notification settings" },
      { status: 500 }
    );
  }
}