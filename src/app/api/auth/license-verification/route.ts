// api/auth/license-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Verify a user's driver's license
export async function POST(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const data = await request.json();
    const { 
      licenseNumber, 
      licenseCategories, 
      expiryDate,
      licenseCountry 
    } = data;

    if (!licenseNumber) {
      return NextResponse.json(
        { error: 'License number is required' },
        { status: 400 }
      );
    }

    // Generate a hash of the license number - this is what we'll store
    // Using SHA-256 for secure one-way hashing
    const hash = crypto
      .createHash('sha256')
      .update(licenseNumber)
      .digest('hex');

    // Generate a unique verification ID that will be shown to users
    // instead of the actual license number
    const verificationId = `BL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Store only the hash and verification status
    // Convert categories array to JSON string
    const categoriesJson = licenseCategories ? JSON.stringify(licenseCategories) : null;
    
    await prisma.userVerification.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        licenseHash: hash,
        licenseVerificationId: verificationId,
        licenseCategories: categoriesJson,
        licenseCountry: licenseCountry,
        licenseExpiryDate: expiryDate ? new Date(expiryDate) : null,
        licenseVerified: true,
        licenseVerificationDate: new Date(),
      },
      create: {
        userId: session.user.id,
        licenseHash: hash,
        licenseVerificationId: verificationId,
        licenseCategories: categoriesJson,
        licenseCountry: licenseCountry,
        licenseExpiryDate: expiryDate ? new Date(expiryDate) : null,
        licenseVerified: true,
        licenseVerificationDate: new Date(),
      },
    });

    // Update the user's hasValidDriversLicense status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hasValidDriversLicense: true }
    });

    return NextResponse.json({ 
      success: true,
      verificationId: verificationId
    });
  } catch (error) {
    console.error('Error verifying license:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying the license' },
      { status: 500 }
    );
  }
}

// Get verification status
export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for cache busting parameter
    const url = new URL(request.url);
    const cacheBuster = url.searchParams.get('_cb');

    // Get the user's verification details
    const verification = await prisma.userVerification.findUnique({
      where: { userId: session.user.id },
      select: {
        licenseVerificationId: true,
        licenseCategories: true,
        licenseCountry: true,
        licenseExpiryDate: true,
        licenseVerified: true,
        licenseVerificationDate: true,
      }
    });

    if (!verification) {
      return NextResponse.json({ 
        verified: false,
        message: 'No license verification found'
      }, {
        headers: {
          // No cache or short cache time
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }

    // Parse the categories JSON string back to an array
    let categories = [];
    try {
      if (verification.licenseCategories) {
        categories = JSON.parse(verification.licenseCategories);
      }
    } catch (e) {
      console.error("Error parsing license categories:", e);
    }

    return NextResponse.json({
      verified: verification.licenseVerified,
      verificationId: verification.licenseVerificationId,
      categories: categories,
      country: verification.licenseCountry,
      expiryDate: verification.licenseExpiryDate,
      verificationDate: verification.licenseVerificationDate
    }, {
      headers: {
        // No cache when cache buster is provided
        'Cache-Control': cacheBuster ? 'no-store, max-age=0' : 'private, max-age=5',
        'X-Cache-Buster': cacheBuster || 'none'
      }
    });
  } catch (error) {
    console.error('Error getting license verification:', error);
    return NextResponse.json(
      { error: 'An error occurred while getting license verification' },
      { status: 500 }
    );
  }
}