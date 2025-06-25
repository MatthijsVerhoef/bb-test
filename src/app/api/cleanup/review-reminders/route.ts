// src/app/api/cleanup/review-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewReminderEmail } from "@/lib/email";

/**
 * This endpoint is meant to be called by a scheduled task (e.g. CRON job)
 * It checks for rentals that were completed 3 days ago and sends review reminder emails
 * to both renters and lessors if they have review reminder notifications enabled.
 */
export async function GET(req: NextRequest) {
  try {
    // Calculate the date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Format to YYYY-MM-DD for date comparison
    const targetDate = threeDaysAgo.toISOString().split('T')[0];
    
    console.log(`🔍 [REVIEW REMINDERS] Looking for rentals completed on ${targetDate}`);
    
    // Find completed rentals that ended 3 days ago
    const completedRentals = await prisma.rental.findMany({
      where: {
        status: "COMPLETED",
        // Check if the rental ended 3 days ago (without considering time)
        // This compares just the date part of endDate
        endDate: {
          gte: new Date(`${targetDate}T00:00:00Z`),
          lt: new Date(`${targetDate}T23:59:59Z`),
        },
      },
      include: {
        trailer: {
          select: {
            id: true,
            title: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
        lessor: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });
    
    console.log(`✉️ [REVIEW REMINDERS] Found ${completedRentals.length} rentals completed 3 days ago`);
    
    const results = {
      total: completedRentals.length,
      renterEmailsSent: 0,
      lessorEmailsSent: 0,
      errors: [],
    };
    
    // Process each rental and send review reminder emails
    for (const rental of completedRentals) {
      try {
        // Send email to renter
        if (rental.renter.email && rental.renter.firstName) {
          try {
            const sent = await sendReviewReminderEmail(
              rental.renter.email,
              rental.renter.firstName,
              {
                trailerTitle: rental.trailer.title,
                otherPartyName: rental.lessor.firstName || "verhuurder",
                rentalId: rental.id,
                isRenter: true,
                rentalEndDate: rental.endDate,
                userId: rental.renter.id,
              }
            );
            
            if (sent) {
              results.renterEmailsSent++;
              console.log(`✅ [REVIEW REMINDERS] Sent renter review reminder for rental ${rental.id} to ${rental.renter.email}`);
            } else {
              console.log(`❌ [REVIEW REMINDERS] Renter has disabled review reminder emails: ${rental.renter.id}`);
            }
          } catch (error) {
            console.error(`❌ [REVIEW REMINDERS] Error sending email to renter ${rental.renter.id}:`, error);
            results.errors.push(`Error sending email to renter ${rental.renter.id}: ${error.message}`);
          }
        }
        
        // Send email to lessor
        if (rental.lessor.email && rental.lessor.firstName) {
          try {
            const sent = await sendReviewReminderEmail(
              rental.lessor.email,
              rental.lessor.firstName,
              {
                trailerTitle: rental.trailer.title,
                otherPartyName: rental.renter.firstName || "huurder",
                rentalId: rental.id,
                isRenter: false,
                rentalEndDate: rental.endDate,
                userId: rental.lessor.id,
              }
            );
            
            if (sent) {
              results.lessorEmailsSent++;
              console.log(`✅ [REVIEW REMINDERS] Sent lessor review reminder for rental ${rental.id} to ${rental.lessor.email}`);
            } else {
              console.log(`❌ [REVIEW REMINDERS] Lessor has disabled review reminder emails: ${rental.lessor.id}`);
            }
          } catch (error) {
            console.error(`❌ [REVIEW REMINDERS] Error sending email to lessor ${rental.lessor.id}:`, error);
            results.errors.push(`Error sending email to lessor ${rental.lessor.id}: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ [REVIEW REMINDERS] Error processing rental ${rental.id}:`, error);
        results.errors.push(`Error processing rental ${rental.id}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} rentals, sent ${results.renterEmailsSent} renter emails and ${results.lessorEmailsSent} lessor emails`,
      results,
    });
    
  } catch (error) {
    console.error("❌ [REVIEW REMINDERS] Error sending review reminders:", error);
    return NextResponse.json(
      { error: "Failed to process review reminders", details: error.message },
      { status: 500 }
    );
  }
}