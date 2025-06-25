import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TrailerType } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const trailerTypeMapping = {
  "Open aanhanger": "OPEN_AANHANGER",
  "Gesloten aanhanger": "GESLOTEN_AANHANGER",
  "Autotransporter": "AUTOTRANSPORTER",
  "Boottrailer": "BOOTTRAILER",
  "Motortrailers": "MOTORFIETS_AANHANGER",
  "Motorfiets aanhanger": "MOTORFIETS_AANHANGER",
  "Paardentrailer": "PAARDENTRAILER",
  "Kipper": "KIPPER",
  "Flatbed aanhanger": "FLATBED_AANHANGER",
  "Bagage aanhanger": "BAGAGE_AANHANGER",
  "Verkoopwagen": "VERKOOPWAGEN",
  "Fietsen aanhanger": "FIETSEN_AANHANGER",
  "Schamel aanhangers": "SCHAMEL_AANHANGERS",
  "Plateauwagens": "PLATEAUWAGENS",
  "Overig": "OVERIG"
};

function getTrailerSizeCategory(trailer) {
  if (!trailer.weight && !trailer.length && !trailer.width && !trailer.height) {
    return "Gemiddeld";
  }

  if (
    (trailer.weight && trailer.weight < 750) ||
    (trailer.length && trailer.length < 350) ||
    (trailer.width && trailer.width < 180)
  ) {
    return "Klein";
  }

  if (
    (trailer.weight && trailer.weight > 1500) ||
    (trailer.length && trailer.length > 500) ||
    (trailer.width && trailer.width > 220) ||
    (trailer.height && trailer.height > 220)
  ) {
    return "Groot";
  }

  return "Gemiddeld";
}

function isValidTrailerType(type) {
  try {
    const validTypes = Object.values(TrailerType);
    return validTypes.includes(type);
  } catch {
    const knownValidTypes = [
      "OPEN_AANHANGER", "GESLOTEN_AANHANGER", "AUTOTRANSPORTER", "PAARDENTRAILER", 
      "BOOTTRAILER", "KIPPER", "MOTORFIETS_AANHANGER", "FLATBED_AANHANGER", 
      "BAGAGE_AANHANGER", "VERKOOPWAGEN", "FIETSEN_AANHANGER", "SCHAMEL_AANHANGERS", 
      "PLATEAUWAGENS", "OVERIG"
    ];
    return knownValidTypes.includes(type);
  }
}

function mapDisplayNameToEnum(displayName) {
  return trailerTypeMapping[displayName] || displayName;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const whereParam = searchParams.get("where");
    const skip = (page - 1) * limit;

    let trailerWhere = {};
    
    if (whereParam) {
      try {
        trailerWhere = JSON.parse(decodeURIComponent(whereParam));
      } catch {}
    }
    
    const dimensionKeys = ['length', 'width', 'height', 'weight', 'capacity'];
    
    dimensionKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        if (!trailerWhere[key]) {
          trailerWhere[key] = { gte: value };
        }
      }
    });

    if (trailerWhere.type) {
      const typeValue = trailerWhere.type;
      const enumValue = mapDisplayNameToEnum(typeValue);
      
      if (isValidTrailerType(enumValue)) {
        trailerWhere.type = enumValue;
      } else {
        delete trailerWhere.type;
        const typeSearchCondition = {
          OR: [
            { title: { contains: typeValue } },
            { category: { name: { contains: typeValue } } }
          ]
        };
        
        trailerWhere.AND = Array.isArray(trailerWhere.AND)
          ? [...trailerWhere.AND, typeSearchCondition]
          : trailerWhere.AND
          ? [trailerWhere.AND, typeSearchCondition]
          : [typeSearchCondition];
      }
    }

    if (trailerWhere.category) {
      trailerWhere.category = { name: { contains: trailerWhere.category } };
      
      if (trailerWhere.OR) {
        const existingOr = trailerWhere.OR;
        delete trailerWhere.OR;
        
        trailerWhere.AND = Array.isArray(trailerWhere.AND)
          ? [...trailerWhere.AND, { OR: existingOr }]
          : trailerWhere.AND
          ? [trailerWhere.AND, { OR: existingOr }]
          : [{ OR: existingOr }];
      }
    }

    if (trailerWhere.mainCategory) {
      const mainCategory = trailerWhere.mainCategory;
      delete trailerWhere.mainCategory;
      
      if (mainCategory === "Klein") {
        trailerWhere.OR = [
          { weight: { lte: 750 } },
          { length: { lte: 350 } },
          { width: { lte: 180 } }
        ];
      } else if (mainCategory === "Groot") {
        trailerWhere.OR = [
          { weight: { gte: 1500 } },
          { length: { gte: 500 } },
          { width: { gte: 220 } },
          { height: { gte: 220 } }
        ];
      } else if (mainCategory === "Gemiddeld") {
        trailerWhere.AND = [
          {
            AND: [
              { OR: [{ weight: { gt: 750 } }, { weight: null }] },
              { OR: [{ length: { gt: 350 } }, { length: null }] },
              { OR: [{ width: { gt: 180 } }, { width: null }] }
            ]
          },
          {
            AND: [
              { OR: [{ weight: { lt: 1500 } }, { weight: null }] },
              { OR: [{ length: { lt: 500 } }, { length: null }] },
              { OR: [{ width: { lt: 220 } }, { width: null }] },
              { OR: [{ height: { lt: 220 } }, { height: null }] }
            ]
          }
        ];
        
        if (trailerWhere.OR) {
          const existingOr = trailerWhere.OR;
          delete trailerWhere.OR;
          
          trailerWhere.AND.push({ OR: existingOr });
        }
      }
    }

    if (trailerWhere.pricePerDay) {
      if (trailerWhere.pricePerDay.gte) {
        trailerWhere.pricePerDay.gte = parseFloat(trailerWhere.pricePerDay.gte) || 0;
      }
      if (trailerWhere.pricePerDay.lte) {
        trailerWhere.pricePerDay.lte = parseFloat(trailerWhere.pricePerDay.lte) || 100;
      }
    }

    try {
      if (trailerWhere.width?.gte) trailerWhere.width.gte = parseFloat(trailerWhere.width.gte) || 0;
      if (trailerWhere.height?.gte) trailerWhere.height.gte = parseFloat(trailerWhere.height.gte) || 0;
      if (trailerWhere.length?.gte) trailerWhere.length.gte = parseFloat(trailerWhere.length.gte) || 0;
      if (trailerWhere.weight?.gte) trailerWhere.weight.gte = parseFloat(trailerWhere.weight.gte) || 0;
      if (trailerWhere.capacity?.gte) trailerWhere.capacity.gte = parseFloat(trailerWhere.capacity.gte) || 0;
    } catch {}

    const trailerSelect = {
      id: true,
      title: true,
      description: true,
      pricePerDay: true,
      available: true,
      city: true,
      type: true,
      latitude: true,
      longitude: true,
      length: true,
      width: true,
      height: true,
      weight: true,
      capacity: true,
      images: {
        take: 1,
        select: { url: true },
      },
      owner: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      reviews: {
        select: { rating: true }
      },
      category: {
        select: { id: true, name: true }
      }
    };

    const [trailers, count] = await Promise.all([
      prisma.trailer.findMany({
        where: trailerWhere,
        select: trailerSelect,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.trailer.count({ where: trailerWhere })
    ]);

    const processedTrailers = trailers.map((t) => {
      const avgRating = t.reviews.length
        ? t.reviews.reduce((sum, r) => sum + r.rating, 0) / t.reviews.length
        : null;
      
      const sizeCategory = getTrailerSizeCategory(t);

      return {
        ...t,
        available: t.available !== false,
        avgRating,
        sizeCategory,
        mainImage: t.images[0]?.url || "/images/default-trailer.jpg",
        ownerName: `${t.owner.firstName || ""} ${t.owner.lastName || ""}`.trim() || "Owner"
      };
    });

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json(
      { trailers: processedTrailers, totalPages },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("Error in trailers API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request", details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
}
