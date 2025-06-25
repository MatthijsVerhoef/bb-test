"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Key,
  Info,
  Shield,
  Truck,
  Wrench,
  Gauge,
  Calendar,
  Tag,
  Award,
} from "lucide-react";
import {
  Net,
  Ramps,
  Pilon,
  WashingMachine,
  Wheelbarrow,
  Canoe,
  Bricks,
  SkiLeft,
  SkiRight,
  Sand,
  PlugLeft,
  PlugRight,
  TrailerHeightDouble,
} from "@/lib/icons/trailer-icons";
import { useTranslation } from "@/lib/i18n/client";

interface InfoItem {
  label: string;
  value: string;
  description?: string;
}

interface TrailerInfoProps {
  title: string;
  items: InfoItem[];
}

export default function TrailerInfo({ title, items }: TrailerInfoProps) {
  const { t } = useTranslation('trailer');
  
  if (!items || items.length === 0) {
    return null;
  }

  // Map common accessoire names to their corresponding icons
  const getIconForItem = (label: string) => {
    const iconMap = {
      Afdeknet: Net,
      Oprijplaten: Ramps,
      Pylonen: Pilon,
      "Wasmachine karretje": WashingMachine,
      Kruiwagen: Wheelbarrow,
      "Kano bevestiging": Canoe,
      Steenklem: Bricks,
      "Ski drager": SkiLeft,
      "Ski houder": SkiRight,
      Zandschep: Sand,
      "Stekker 7-polig": PlugLeft,
      "Stekker 13-polig": PlugRight,
      Garantie: Shield,
      Verzekering: Shield,
      Hoogte: TrailerHeightDouble,
      Breedte: TrailerHeightDouble,
      Lengte: TrailerHeightDouble,
      Gewicht: Gauge,
      Bouwjaar: Calendar,
      Merk: Award,
      Model: Tag,
      Type: Truck,
      Accessoires: Wrench,
    };

    // Get the icon if it exists in the map, otherwise return Package as default
    if (label in iconMap) {
      const IconComponent = iconMap[label];
      return <IconComponent size={22} strokeWidth={1.5} color="#222222" />;
    }

    return <Key size={22} strokeWidth={1.5} />;
  };

  return (
    <Card className=" p-0 border-0 rounded-none shadow-none pb-10 border-b">
      <h4 className="font-semibold text-lg text-[#222222]">{t('accessories')}</h4>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col bg-white p-0 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="text-[#222] flex-shrink-0">
                    {getIconForItem(item.label)}
                  </div>
                  <span className="font-medium text-sm ms-2 text-[#222222]">
                    {item.label}
                  </span>
                </div>
                <span className="text-gray-700 text-xs">({item.value})</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
