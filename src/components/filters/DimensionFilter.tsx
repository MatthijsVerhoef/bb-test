// components/filters/DimensionFilter.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { DimensionFilterProps } from "@/types/filter-types";

export const DimensionFilter: React.FC<DimensionFilterProps> = ({
  value,
  onChange,
  label,
  icon,
  unit,
  id,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center mb-2 text-xs text-gray-700"
      >
        {icon}
        <span className="ms-2.5">{label}</span>
        <span className="ms-auto text-gray-500">{unit}</span>
      </label>
      <div className="relative mt-3">
        <Input
          id={id}
          type="number"
          min="0"
          step="10"
          placeholder={unit}
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (
              val === "" ||
              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
            ) {
              onChange(val);
            }
          }}
          className="w-full shadow-none focus:border-orange-300 transition-all pr-2"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={`Clear ${label}`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
