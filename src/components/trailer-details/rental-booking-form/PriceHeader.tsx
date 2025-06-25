import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";

interface PriceHeaderProps {
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  available: boolean;
}

export default function PriceHeader({
  pricePerDay,
  pricePerWeek,
  pricePerMonth,
  available,
}: PriceHeaderProps) {
  const { t } = useTranslation("trailer");

  const getWeeklyDiscount = () => {
    if (pricePerWeek && pricePerDay) {
      return Math.round((1 - pricePerWeek / (7 * pricePerDay)) * 100);
    }
    return 0;
  };

  const getMonthlyDiscount = () => {
    if (pricePerMonth && pricePerDay) {
      return Math.round((1 - pricePerMonth / (30 * pricePerDay)) * 100);
    }
    return 0;
  };

  return (
    <div className="flex justify-between items-center overflow-visible w-full">
      <div className="flex flex-col items-baseline">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-[#222222]">
            €{pricePerDay.toFixed(2)}
          </span>
          {/* {(pricePerWeek || pricePerMonth) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white p-3 w-60 text-black">
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-sm">
                      {t("booking.discounts.title")}
                    </h4>
                    {pricePerWeek && (
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">
                          {t("booking.discounts.perWeek")}
                        </span>
                        <span className="text-xs text-gray-500">
                          €{pricePerWeek.toFixed(2)} (-{getWeeklyDiscount()}%)
                        </span>
                      </div>
                    )}
                    {pricePerMonth && (
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">
                          {t("booking.discounts.perMonth")}
                        </span>
                        <span className="text-xs text-gray-500">
                          €{pricePerMonth.toFixed(2)} (-{getMonthlyDiscount()}%)
                        </span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )} */}
        </div>
        <span className="text-sm text-gray-500">
          {t("booking.pricePerDay")}
        </span>
      </div>
      {!available && (
        <div className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-md">
          {t("booking.notAvailable")}
        </div>
      )}
    </div>
  );
}
