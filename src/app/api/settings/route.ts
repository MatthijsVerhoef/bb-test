// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue } from "@/lib/redis-client";

// Settings cache TTL in seconds (5 minutes)
const SETTINGS_CACHE_TTL = 300;

// Default settings for unauthenticated users or fallback
const defaultSettings = {
  appearance: {
    theme: "system",
    colorScheme: "default",
    fontSize: "default",
    reduceMotion: false,
    reduceTransparency: false,
    highContrast: false,
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  preferences: {
    language: "nl",
    defaultSearchRadius: 25,
    notifyBeforeRental: 24,
    notifyBeforeReturn: 24,
    newsletterSubscription: true,
  }
};

/**
 * GET handler to retrieve all user settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get token directly instead of using getServerSession for better performance
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // If no authenticated user, return default settings with long cache
    if (!token || !token.id) {
      return NextResponse.json(defaultSettings, {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    }
    
    const userId = token.id as string;
    
    // Try to get cached settings first
    const cacheKey = `settings:${userId}`;
    const cachedSettings = await getCacheValue(cacheKey);
    if (cachedSettings) {
      return NextResponse.json(cachedSettings, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
          'X-Source': 'cache'
        }
      });
    }
    
    // Use a raw query to fetch only what we need in one go
    // This is much faster than using Prisma's include with nested relations
    const [user, preferences] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: true,
          languagePreference: true,
        },
      }),
      prisma.userPreference.findUnique({
        where: { userId },
        select: {
          darkMode: true,
          defaultSearchRadius: true,
          notifyBeforeRental: true,
          notifyBeforeReturn: true,
          newsletterSubscription: true,
          appearanceSettings: true,
        },
      })
    ]);
    
    // If no user found, return default settings
    if (!user) {
      return NextResponse.json(defaultSettings, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
        }
      });
    }
    
    // Parse appearance settings
    let appearanceSettings = {};
    if (preferences?.appearanceSettings) {
      try {
        appearanceSettings = JSON.parse(preferences.appearanceSettings);
      } catch (e) {
        console.error("Error parsing appearanceSettings:", e);
      }
    }
    
    // Build settings object
    const settings = {
      appearance: {
        theme: preferences?.darkMode ? "dark" : "light",
        colorScheme: "default",
        fontSize: "default",
        reduceMotion: false,
        reduceTransparency: false,
        highContrast: false,
        ...appearanceSettings
      },
      notifications: {
        email: user.emailNotifications ?? true,
        push: user.pushNotifications ?? true,
        sms: user.smsNotifications ?? false,
      },
      preferences: {
        language: user.languagePreference || "nl",
        defaultSearchRadius: preferences?.defaultSearchRadius || 25,
        notifyBeforeRental: preferences?.notifyBeforeRental || 24,
        notifyBeforeReturn: preferences?.notifyBeforeReturn || 24,
        newsletterSubscription: preferences?.newsletterSubscription ?? true,
      },
    };
    
    // Cache the settings
    await setCacheValue(cacheKey, settings, { ex: SETTINGS_CACHE_TTL });
    
    // Add cache control headers
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        'X-Source': 'database'
      }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Error fetching settings" },
      { status: 500 }
    );
  }
}