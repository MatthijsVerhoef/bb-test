import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ trailerId: string }> }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { trailerId: blockedPeriodId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "LESSOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "You need to be a lessor to perform this action" },
        { status: 403 }
      );
    }

    // Find the blocked period
    const blockedPeriod = await prisma.blockedPeriod.findFirst({
      where: {
        id: blockedPeriodId,
        OR: [
          { userId: userId },
          { trailer: { ownerId: userId } },
        ],
      },
    });

    if (!blockedPeriod) {
      return NextResponse.json(
        { error: "Blocked period not found or doesn't belong to you" },
        { status: 404 }
      );
    }

    // Delete the blocked period
    await prisma.blockedPeriod.delete({
      where: {
        id: blockedPeriodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blocked period:", error);
    return NextResponse.json(
      { error: "Failed to delete blocked period" },
      { status: 500 }
    );
  }
}