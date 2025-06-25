// components/filters/CategoryFilter.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Hitch } from "@/lib/icons/trailer-icons";
import { useTranslation } from "@/lib/i18n/client";

interface CategoryFilterProps {
  categories: any[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  getIconForType: (typeId: string) => React.ReactElement | null;
  loading?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  getIconForType,
  loading = false,
}) => {
  const { t } = useTranslation("home");
  const [showAll, setShowAll] = useState(false);

  const visibleCategories = showAll ? categories : categories.slice(0, 6);

  if (loading) {
    return (
      <div className="col-span-2 py-4 text-center text-gray-500">
        {t("loading")}...
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {visibleCategories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => onCategorySelect(category.name)}
            className={cn(
              "flex h-20 flex-col items-center justify-center py-2 px-3 rounded-md transition-all",
              selectedCategory === category.name
                ? "bg-orange-50 text-orange-700 border border-orange-200"
                : "text-gray-700 hover:bg-gray-50 border border-gray-100 cursor-pointer"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {React.cloneElement(getIconForType(category.id) || <Hitch />, {
                size: 22,
                strokeWidth: 1.5,
                color:
                  selectedCategory === category.name ? "#c2410c" : "#374151",
              })}
            </div>
            <span className="text-xs text-center w-full">{category.name}</span>
          </motion.button>
        ))}
      </div>

      {categories.length > 6 && (
        <motion.button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center bg-[#f6f8f9] text-[13px] text-gray-600 w-full mt-3 py-3 rounded-full hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {showAll ? (
            <>
              <ChevronUp size={14} className="mr-1" /> {t("filters.showLess")}
            </>
          ) : (
            <>
              <ChevronDown size={14} className="mr-1" /> {t("filters.showMore")}{" "}
              ({categories.length - 6} {t("filters.more")})
            </>
          )}
        </motion.button>
      )}
    </>
  );
};
