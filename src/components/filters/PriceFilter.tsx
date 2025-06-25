// components/filters/PriceFilter.tsx
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/lib/i18n/client";

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  onChange: (values: number[]) => void;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  minPrice,
  maxPrice,
  onChange,
}) => {
  const { t } = useTranslation("home");

  return (
    <div className="mt-4">
      <Slider
        value={[minPrice, maxPrice]}
        min={0}
        max={1000}
        step={5}
        onValueChange={onChange}
        className="mb-4"
      />
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>€{minPrice}</span>
        <span>€{maxPrice}</span>
      </div>
    </div>
  );
};
