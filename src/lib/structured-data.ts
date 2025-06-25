// src/lib/structured-data.ts
import { mapEnumToTrailerType } from './trailer-type-mapper';

/**
 * Generate JSON-LD structured data for the trailer listings page
 * @param trailers Array of trailer objects
 * @param baseUrl Base URL of the site
 * @returns JSON-LD structured data for trailer listings
 */
export function generateTrailerListingStructuredData(trailers: any[], baseUrl: string) {
  // Generate offers structured data for the trailers
  const offers = trailers.map(trailer => ({
    "@type": "Offer",
    "name": trailer.title,
    "description": trailer.description || `${trailer.title} te huur in ${trailer.city}`,
    "price": trailer.pricePerDay.toFixed(2),
    "priceCurrency": "EUR",
    "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    "availability": trailer.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    "url": `${baseUrl}/aanbod/${trailer.id}`,
    "seller": {
      "@type": "Person",
      "name": trailer.ownerName || "Verhuurder op BuurBak"
    },
    "category": mapEnumToTrailerType(trailer.type) || "Aanhangwagen",
    "image": trailer.mainImage || `${baseUrl}/images/trailer-placeholder.jpg`
  }));

  // Main structured data for the page
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": trailers.map((trailer, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": trailer.title,
        "description": trailer.description || `${trailer.title} te huur in ${trailer.city}`,
        "category": mapEnumToTrailerType(trailer.type) || "Aanhangwagen",
        "image": trailer.mainImage || `${baseUrl}/images/trailer-placeholder.jpg`,
        "offers": {
          "@type": "Offer",
          "availability": trailer.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "price": trailer.pricePerDay.toFixed(2),
          "priceCurrency": "EUR",
          "seller": {
            "@type": "Person",
            "name": trailer.ownerName || "Verhuurder op BuurBak"
          }
        }
      }
    }))
  };
}

/**
 * Generate JSON-LD structured data for the website (Organization)
 * @param baseUrl Base URL of the site
 * @returns Organization structured data
 */
export function generateOrganizationStructuredData(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BuurBak",
    "url": baseUrl,
    "logo": `${baseUrl}/bb-logo.svg`,
    "description": "Het platform voor het huren en verhuren van aanhangers in jouw buurt.",
    "sameAs": [
      "https://www.facebook.com/BuurBak",
      "https://www.instagram.com/buurbak_nl/",
      "https://twitter.com/BuurBak",
      "https://www.linkedin.com/company/buurbak/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+31-XX-XXXXXXX",
      "contactType": "customer service",
      "availableLanguage": ["Dutch", "English"]
    }
  };
}

/**
 * Generate FAQPage structured data
 * @param faqItems Array of FAQ items with question and answer
 * @returns FAQPage structured data
 */
export function generateFAQStructuredData(faqItems: { question: string, answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}

/**
 * Generates LocalBusiness structured data for rental locations
 * @param cities Array of city names
 * @returns LocalBusiness structured data
 */
export function generateLocalBusinessStructuredData(cities: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "BuurBak Aanhangwagen Verhuur",
    "description": "Verhuur en huur van aanhangers tussen particulieren in heel Nederland.",
    "areaServed": cities.map(city => ({
      "@type": "City",
      "name": city
    })),
    "priceRange": "€€",
    "openingHours": "Mo-Su 00:00-23:59",
    "serviceType": "Aanhangwagen Verhuur"
  };
}