// app/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TrailerType } from "@prisma/client";

import { EmailVerificationModal } from "@/components/constants/auth/email-verified-dialog";
import HomePageClient from "@/components/home/home-page-client";
import TrailerSeoContent from "@/components/seo/trailer-seo-content";
import FAQSection from "@/components/seo/home-faq";

// Cache results for 60 seconds instead of 10
export const revalidate = 60;

// Import structured data generators
import {
  generateTrailerListingStructuredData,
  generateOrganizationStructuredData,
  generateFAQStructuredData,
  generateLocalBusinessStructuredData,
} from "@/lib/structured-data";

// Generate metadata with more rich structured data for SEO
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://buurbak.nl";

  return {
    title:
      "BuurBak - Huur of Verhuur een Aanhanger in Jouw Buurt | Goedkoop & Verzekerd",
    description:
      "Vind direct beschikbare aanhangers in jouw buurt. Huur tot 40% goedkoper dan bij commerciële verhuurbedrijven. Alle soorten aanhangers: open, gesloten, autotrailers, boottrailers en meer.",
    keywords: [
      "aanhanger huren",
      "aanhanger verhuren",
      "aanhangwagen",
      "particuliere verhuur",
      "goedkope aanhanger",
      "open aanhanger",
      "gesloten aanhanger",
      "trailer verhuur",
    ],
    alternates: {
      canonical: `${baseUrl}/aanbod`,
    },
    authors: [{ name: "BuurBak" }],
    openGraph: {
      type: "website",
      url: `${baseUrl}/aanbod`,
      title: "BuurBak - Huur of Verhuur een Aanhanger in Jouw Buurt",
      description:
        "Vind snel en eenvoudig een aanhanger in jouw buurt. Huur direct van particulieren en bespaar gemiddeld 40% op de huurprijs.",
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "BuurBak platform voor het huren en verhuren van aanhangers",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "BuurBak - Aanhanger huren of verhuren",
      description:
        "Het platform voor het huren en verhuren van aanhangers in jouw buurt.",
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

interface SearchParams {
  page?: string;
  mainCategory?: string;
  category?: string;
  type?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  available?: string;
  horizontalWidth?: string;
  verticalWidth?: string;
  height?: string;
  driverLicense?: string;
  accessories?: string;
  startDate?: string;
  endDate?: string;
}

interface OfferPageProps {
  params: {};
  searchParams: Promise<SearchParams>;
}

function getTrailerSizeCategory(trailer: any) {
  if (!trailer.weight && !trailer.length && !trailer.width && !trailer.height) {
    return "Gemiddeld";
  }

  // Small trailers
  if (
    (trailer.weight && trailer.weight < 750) ||
    (trailer.length && trailer.length < 3.5) ||
    (trailer.width && trailer.width < 1.8)
  ) {
    return "Klein";
  }

  // Large trailers
  if (
    (trailer.weight && trailer.weight > 1500) ||
    (trailer.length && trailer.length > 5) ||
    (trailer.width && trailer.width > 2.2) ||
    (trailer.height && trailer.height > 2.2)
  ) {
    return "Groot";
  }

  // Medium trailers (default)
  return "Gemiddeld";
}

function isValidTrailerType(type: string): boolean {
  const validTypes = [
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
    "OVERIG",
  ];

  return validTypes.includes(type);
}

export default async function TrailersPage({
  params,
  searchParams,
}: OfferPageProps) {
  const sp = await searchParams;

  const {
    page: pageParam = "1",
    mainCategory,
    category,
    type,
    city,
    minPrice,
    maxPrice,
    available,
    horizontalWidth,
    verticalWidth,
    height,
    driverLicense,
    accessories: accessoriesParam = "",
    startDate,
    endDate,
  } = sp ?? {};

  const page = parseInt(pageParam, 10);
  const limit = 27;
  const skip = (page - 1) * limit;

  // Parse accessories if present
  const accessories = accessoriesParam ? accessoriesParam.split(",") : [];

  // Build filter conditions
  const trailerWhere: any = {};

  // Price filters
  if (minPrice) {
    trailerWhere.pricePerDay = {
      ...trailerWhere.pricePerDay,
      gte: parseFloat(minPrice),
    };
  }

  if (maxPrice) {
    trailerWhere.pricePerDay = {
      ...trailerWhere.pricePerDay,
      lte: parseFloat(maxPrice),
    };
  }

  // Available filter - default to true
  if (available === "true" || !available) {
    trailerWhere.available = true;
  }

  // City filter
  if (city) {
    trailerWhere.city = {
      contains: city,
    };
  }

  // Dimension filters - Convert from cm to m for database queries
  if (horizontalWidth) {
    const lengthValue = parseFloat(horizontalWidth) / 100;
    trailerWhere.length = {
      gte: lengthValue,
    };
  }

  if (verticalWidth) {
    const widthValue = parseFloat(verticalWidth) / 100;
    trailerWhere.width = {
      gte: widthValue,
    };
  }

  if (height) {
    const heightValue = parseFloat(height) / 100;
    trailerWhere.height = {
      gte: heightValue,
    };
  }

  // Driver license
  if (driverLicense && driverLicense !== "none") {
    trailerWhere.requiresDriversLicense = true;
  }

  // Accessories
  if (accessories.length > 0) {
    trailerWhere.accessories = {
      some: {
        id: {
          in: accessories,
        },
      },
    };
  }

  // Handle type and category
  if (type) {
    try {
      if (isValidTrailerType(type)) {
        trailerWhere.type = type as TrailerType;
      } else if (!category) {
        trailerWhere.OR = [
          {
            title: {
              contains: type,
            },
          },
          {
            category: {
              name: {
                contains: type,
              },
            },
          },
        ];
      }
    } catch (error) {
      console.warn(
        `Error processing trailer type filter for "${type}":`,
        error
      );
      if (!category) {
        trailerWhere.OR = [
          {
            title: {
              contains: type,
            },
          },
          {
            category: {
              name: {
                contains: type,
              },
            },
          },
        ];
      }
    }
  }

  // Category filter
  if (category && (!type || isValidTrailerType(type))) {
    trailerWhere.category = {
      name: {
        contains: category,
      },
    };
  }

  // Main category size-based filters
  if (mainCategory) {
    const sizeConditions = [];

    if (mainCategory === "Klein") {
      sizeConditions.push(
        { weight: { lte: 750 } },
        { length: { lte: 3.5 } },
        { width: { lte: 1.8 } }
      );
    } else if (mainCategory === "Groot") {
      sizeConditions.push(
        { weight: { gte: 1500 } },
        { length: { gte: 5 } },
        { width: { gte: 2.2 } },
        { height: { gte: 2.2 } }
      );
    } else if (mainCategory === "Gemiddeld") {
      sizeConditions.push({
        AND: [
          { OR: [{ weight: { gt: 750 } }, { weight: null }] },
          { OR: [{ weight: { lt: 1500 } }, { weight: null }] },
        ],
      });
    }

    if (sizeConditions.length > 0) {
      if (!trailerWhere.OR) {
        trailerWhere.OR = sizeConditions;
      } else {
        const existingOr = trailerWhere.OR;
        delete trailerWhere.OR;
        trailerWhere.AND = [{ OR: existingOr }, { OR: sizeConditions }];
      }
    }
  }

  // Date availability filters
  if (startDate && endDate) {
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    trailerWhere.rentals = {
      none: {
        AND: [
          { status: { in: ["CONFIRMED", "ACTIVE"] } },
          {
            OR: [
              {
                startDate: {
                  gte: startDateTime,
                  lte: endDateTime,
                },
              },
              {
                endDate: {
                  gte: startDateTime,
                  lte: endDateTime,
                },
              },
              {
                startDate: { lte: startDateTime },
                endDate: { gte: endDateTime },
              },
            ],
          },
        ],
      },
    };
  }

  // OPTIMIZED QUERY: Fetch everything in a single query with includes
  const data = await prisma.$transaction(async (tx) => {
    // Fetch trailers with all related data in ONE query
    const [trailers, totalTrailers] = await Promise.all([
      tx.trailer.findMany({
        where: trailerWhere,
        select: {
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
          createdAt: true,
          // Include related data directly
          owner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          images: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true },
          },
          reviews: {
            select: { rating: true },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          // Get rental count for popularity
          _count: {
            select: { rentals: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      // Count query runs in parallel
      tx.trailer.count({ where: trailerWhere }),
    ]);

    return { trailers, totalTrailers };
  });

  // Process trailers - all data is already included
  const processedTrailers = data.trailers.map((trailer) => {
    // Calculate average rating
    const avgRating =
      trailer.reviews.length > 0
        ? trailer.reviews.reduce((sum, r) => sum + r.rating, 0) /
          trailer.reviews.length
        : null;

    // Determine size category
    const sizeCategory = getTrailerSizeCategory(trailer);

    // Format owner name
    const ownerName = trailer.owner
      ? `${trailer.owner.firstName || ""} ${
          trailer.owner.lastName || ""
        }`.trim() || "Owner"
      : "Owner";

    // Get first image URL
    const mainImage =
      trailer.images[0]?.url || "/images/trailer-placeholder.jpg";

    return {
      ...trailer,
      avgRating,
      sizeCategory,
      mainImage,
      ownerName,
      rentalCount: trailer._count.rentals,
    };
  });

  const totalPages = Math.ceil(data.totalTrailers / limit);

  const mapMarkers = processedTrailers
    .filter((t) => t.latitude && t.longitude)
    .map((t) => ({
      id: t.id,
      title: t.title,
      latitude: t.latitude,
      longitude: t.longitude,
      price: t.pricePerDay,
      image: t.images?.[0]?.url || t.mainImage,
      rating: t.averageRating || 4.5,
      location: t.city || t.location,
    }));

  // Count active filters
  const activeFilterCount = (() => {
    let count = 0;
    if (mainCategory) count++;
    if (category) count++;
    if (type && type !== category) count++;
    if (minPrice && minPrice !== "0") count++;
    if (maxPrice && maxPrice !== "1000") count++;
    if (horizontalWidth) count++;
    if (verticalWidth) count++;
    if (height) count++;
    if (driverLicense && driverLicense !== "none") count++;
    if (accessories.length > 0) count += accessories.length;
    if (startDate) count++;
    if (endDate && endDate !== startDate) count++;
    return count;
  })();

  // Gather all current filters
  const currentFilters = {
    mainCategory,
    category,
    type,
    minPrice,
    maxPrice,
    available,
    horizontalWidth,
    verticalWidth,
    height,
    driverLicense,
    accessories,
    startDate,
    endDate,
  };

  // Generate structured data for SEO
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://buurbak.nl";

  const faqItems = [
    {
      question: "Hoe werkt BuurBak?",
      answer:
        "BuurBak is een platform waar particulieren aanhangers kunnen huren en verhuren. Je zoekt een geschikte aanhanger in je buurt, maakt een reservering, haalt de aanhanger op bij de eigenaar en brengt deze na gebruik terug.",
    },
    {
      question: "Wat kost het huren van een aanhanger?",
      answer:
        "De prijs voor het huren van een aanhanger varieert tussen €15 en €75 per dag, afhankelijk van het type, grootte en locatie. Dit is gemiddeld 30-40% goedkoper dan bij commerciële verhuurbedrijven.",
    },
    {
      question: "Welk rijbewijs heb ik nodig voor het huren van een aanhanger?",
      answer:
        "Voor aanhangers tot 750 kg volstaat een B-rijbewijs. Voor zwaardere aanhangers is meestal een BE-rijbewijs vereist, vooral als het totaalgewicht van auto en aanhanger meer dan 3500 kg bedraagt.",
    },
    {
      question: "Zijn de aanhangers verzekerd?",
      answer:
        "Ja, alle aanhangers die via BuurBak worden verhuurd zijn verzekerd. De verzekering dekt schade aan de aanhanger tijdens de huurperiode.",
    },
  ];

  const popularCities = [
    "Amsterdam",
    "Rotterdam",
    "Utrecht",
    "Den Haag",
    "Eindhoven",
    "Groningen",
    "Tilburg",
    "Almere",
    "Breda",
    "Nijmegen",
  ];

  // Generate all structured data
  const trailersStructuredData = generateTrailerListingStructuredData(
    processedTrailers,
    baseUrl
  );
  const organizationStructuredData =
    generateOrganizationStructuredData(baseUrl);
  const faqStructuredData = generateFAQStructuredData(faqItems);
  const localBusinessStructuredData =
    generateLocalBusinessStructuredData(popularCities);

  return (
    <div className="pb-12 lg:pb-12 pt-34 lg:pt-32">
      {/* Add structured data JSON-LD scripts for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(trailersStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessStructuredData),
        }}
      />

      <EmailVerificationModal />
      <HomePageClient
        currentFilters={currentFilters}
        activeFilterCount={activeFilterCount}
        selectedCity={city}
        mapMarkers={mapMarkers}
        processedTrailers={processedTrailers}
        page={page}
        limit={limit}
        totalPages={totalPages}
        startDate={startDate}
      />
      {/* <TrailerSeoContent />
      <FAQSection /> */}
    </div>
  );
}
