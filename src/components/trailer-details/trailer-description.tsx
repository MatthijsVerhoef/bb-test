"use client";
import { Card, CardContent } from "@/components/ui/card";
import { TrailerType } from "@prisma/client";
import {
  getEnhancedTrailerDescription,
  generateTrailerFeatures,
} from "@/lib/utils/trailer-type-utils";

interface TrailerDescriptionProps {
  type?: TrailerType | null;
  customDescription?: string | null;
  features: any;
  weight?: number | null;
  capacity?: number | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };
  brakes?: boolean;
  manufacturer?: string | null;
  year?: number | null;
}

export default function TrailerDescription({
  type,
  customDescription,
  features,
  weight,
  capacity,
  dimensions,
  brakes,
  manufacturer,
  year,
}: TrailerDescriptionProps) {
  // Always prioritize standardized descriptions over custom ones
  const description = getEnhancedTrailerDescription(type, manufacturer, year);

  const standardFeatures = generateTrailerFeatures(
    type,
    brakes,
    capacity,
    weight,
    dimensions,
    manufacturer,
    year
  );

  let featuresList;
  if (Array.isArray(features) && features.length > 0) {
    featuresList = features;
  } else if (
    typeof features === "object" &&
    features !== null &&
    Object.keys(features).length > 0
  ) {
    featuresList = Object.entries(features).map(([key, value]) => ({
      name: key,
      value: value,
    }));
  } else {
    featuresList = standardFeatures.map((feature) => ({
      name: feature,
      value: true,
    }));
  }

  // 4) Render
  return (
    <Card className="border-l-0 border-r-0 rounded-none border-b p-0 pt-6 pb-3 border-t shadow-none">
      <CardContent className="p-0">
        {description && (
          <div className="prose mb-6 text-gray-700 text-[14px] max-w-[90%]">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
