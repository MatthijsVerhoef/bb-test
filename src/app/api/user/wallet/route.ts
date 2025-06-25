// app/api/user/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user wallet from database
    let wallet = await prisma.wallet.findUnique({
      where: {
        userId: session.user.id as string,
      },
    });

    // If wallet doesn't exist, create one
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id as string,
          balance: 0,
          currency: "EUR",
        },
      });
    }

    return NextResponse.json({
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
      lastPayout: wallet.lastPayout,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Error fetching wallet" },
      { status: 500 }
    );
  }
}