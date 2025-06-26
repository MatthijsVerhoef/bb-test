import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Retrieve all trailer types from the database
    const trailerTypes = await prisma.trailerCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        mainCategoryId: true,
        mainCategory: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ 
      trailerTypes,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching trailer types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trailer types', success: false },
      { status: 500 }
    );
  }
}