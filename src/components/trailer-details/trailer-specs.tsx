"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrailerType } from "@prisma/client";
import {
  TrailerWidthTop,
  TrailerWidthBottom,
  TrailerHeight,
  DrawBarTrailer,
  Hitch,
} from "@/lib/icons/trailer-icons";
import {
  Weight,
  Package,
  Wrench,
  Check,
  X as XIcon,
  Gauge,
  TruckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTrailerTypeDetails,
  formatTrailerType,
} from "@/lib/utils/trailer-type-utils";
import { useTranslation } from "@/lib/i18n/client";
import LicenseBanner from "./LicenseBanner";

interface TrailerSpecsProps {
  type?: TrailerType | null;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };
  weight?: number | null;
  capacity?: number | null;
  axles?: number | null;
  brakes?: boolean;
  maxSpeed?: number | null;
  towBallWeight?: number | null;
  vinNumber?: string | null;
  lastMaintenance?: Date | null;
  category: any;
  requiresDriversLicense: boolean;
}

export default function TrailerSpecs({
  type,
  manufacturer,
  model,
  year,
  dimensions,
  weight,
  capacity,
  axles,
  brakes,
  maxSpeed,
  category,
  towBallWeight,
  vinNumber,
  lastMaintenance,
  requiresDriversLicense,
}: TrailerSpecsProps) {
  const { t } = useTranslation("trailer");

  // Get type details from our shared utility
  const typeDetails = type ? getTrailerTypeDetails(type) : null;

  // Generate dimension specs
  const dimensionSpecs = [];
  if (dimensions?.length) {
    dimensionSpecs.push({
      label: t("specs.length"),
      value: `${dimensions.length} cm`,
      icon: <TrailerWidthTop size={20} strokeWidth="1.5" />,
      description: "De totale lengte van de aanhangwagen van voor naar achter.",
    });
  }
  if (dimensions?.width) {
    dimensionSpecs.push({
      label: t("specs.width"),
      value: `${dimensions.width} cm`,
      icon: <TrailerWidthBottom size={20} strokeWidth="1.5" />,
      description: "De breedte van de aanhangwagen van links naar rechts.",
    });
  }
  if (dimensions?.height) {
    dimensionSpecs.push({
      label: t("specs.height"),
      value: `${dimensions.height} cm`,
      icon: <TrailerHeight size={20} strokeWidth="1.5" />,
      description: "De hoogte van de aanhangwagen van onder tot boven.",
    });
  }

  // Generate capacity specs
  const capacitySpecs = [];
  if (weight) {
    capacitySpecs.push({
      label: t("specs.weight"),
      value: `${weight} kg`,
      icon: (
        <svg
          width={22}
          viewBox="0 0 26 24.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#000"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.5 20.9994H13.5M20.5 20.9994V14.5M20.5 20.9994H24.8C24.9105 20.9994 25 20.9098 25 20.7994V17.6653M13.5 20.9994V20.9994C13.5 19.6187 12.3807 18.4988 11 18.4988V18.4988C9.61929 18.4988 8.5 19.6187 8.5 20.9994V20.9994M13.5 20.9994V20.9994C13.5 22.3801 12.3807 23.5 11 23.5V23.5C9.61929 23.5 8.5 22.3801 8.5 20.9994V20.9994M8.5 20.9994H3.5C2.11929 20.9994 1 19.8801 1 18.4994V15.7C1 15.0373 1.53726 14.5 2.2 14.5H20.5M20.5 14.5V9.49997M10.5 4V4C11.3284 4 12 3.32843 12 2.5V2.5C12 1.67157 11.3284 1 10.5 1V1C9.67157 1 9 1.67157 9 2.5V2.5C9 3.32843 9.67157 4 10.5 4ZM6.22361 5.55279L3.3618 11.2764C3.19558 11.6088 3.43733 12 3.80902 12H17.191C17.5627 12 17.8044 11.6088 17.6382 11.2764L14.7764 5.55279C14.607 5.214 14.2607 5 13.882 5H7.11803C6.73926 5 6.393 5.214 6.22361 5.55279Z" />
        </svg>
      ),
      description: "Het leeggewicht van de aanhanger zonder lading.",
    });
  }
  if (capacity) {
    capacitySpecs.push({
      label: t("specs.capacity"),
      value: `${capacity} ton`,
      icon: (
        <svg
          width={22}
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#000"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.5 22.4994H13.5M20.5 22.4994V16M20.5 22.4994H24.8C24.9105 22.4994 25 22.4098 25 22.2994V19.1653M13.5 22.4994V22.4994C13.5 21.1187 12.3807 19.9988 11 19.9988V19.9988C9.61929 19.9988 8.5 21.1187 8.5 22.4994V22.4994M13.5 22.4994V22.4994C13.5 23.8801 12.3807 25 11 25V25C9.61929 25 8.5 23.8801 8.5 22.4994V22.4994M8.5 22.4994H3.5C2.11929 22.4994 1 21.3801 1 19.9994V17.2C1 16.5373 1.53726 16 2.2 16H20.5M20.5 16V11M7.5 7C8.29368 6.71139 9.12644 6.12644 10.5 7.5C12 9 13.2461 7.66344 14 7.5M7 2.99V3M5.6 13.75H16.15C16.7575 13.75 17.25 13.2575 17.25 12.65V2.1C17.25 1.49249 16.7575 1 16.15 1L5.6 1C4.99249 1 4.5 1.49249 4.5 2.1V12.65C4.5 13.2575 4.99249 13.75 5.6 13.75ZM10.875 4V4C9.01104 4 7.5 5.51104 7.5 7.375V7.375C7.5 9.23896 9.01104 10.75 10.875 10.75V10.75C12.739 10.75 14.25 9.23896 14.25 7.375V7.375C14.25 5.51104 12.739 4 10.875 4Z" />
        </svg>
      ),
      description:
        "De maximale laadcapaciteit die de aanhanger veilig kan dragen.",
    });
  }

  // Extended spec details with icons, descriptions, and more context
  const createSpecs = () => {
    const baseSpecs = [
      {
        label: t("specs.type"),
        value: type ? formatTrailerType(type) : undefined,
        icon: typeDetails?.icon || <TruckIcon size={24} strokeWidth="1.5" />,
        description: typeDetails?.description,
        primary: true,
      },
      {
        label: t("specs.axles"),
        value:
          axles === 1
            ? t("specs.singleAxle")
            : axles === 2
            ? t("specs.tandemAxle")
            : axles === 3
            ? t("specs.tripleAxle")
            : axles?.toString(),
        icon:
          axles && axles > 1 ? (
            <DrawBarTrailer size={24} strokeWidth="1.5" />
          ) : (
            <Hitch size={24} strokeWidth="1.5" />
          ),
        description:
          "Het aantal assen waarop de aanhanger rust. Meer assen betekenen meestal een hogere laadcapaciteit en stabiliteit.",
      },
      {
        label: t("specs.brakes"),
        value:
          brakes !== undefined
            ? brakes
              ? t("specs.hydraulic")
              : t("specs.none")
            : undefined,
        icon: brakes ? (
          <Check size={18} className="text-green-500" />
        ) : (
          <XIcon size={18} className="text-red-500" />
        ),
        description:
          "Geeft aan of de aanhanger is uitgerust met een remsysteem. Aanhangers met remmen hebben een hogere maximale belasting.",
      },
      {
        label: t("specs.maxSpeed"),
        value: maxSpeed ? `${maxSpeed} km/u` : undefined,
        icon: <Gauge size={18} />,
        description:
          "De maximaal toegestane snelheid voor deze aanhanger, zoals aangegeven door de fabrikant.",
      },
      {
        label: t("specs.towBallWeight"),
        value: towBallWeight ? `${towBallWeight} kg` : undefined,
        icon: <DrawBarTrailer size={18} />,
        description:
          "Het gewicht dat op de trekhaak van het voertuig drukt. Dit is belangrijk voor de stabiliteit tijdens het rijden.",
      },
      {
        label: t("specs.vinNumber"),
        value: vinNumber,
        icon: <Wrench size={18} />,
        description:
          "Het unieke identificatienummer van de aanhanger, vergelijkbaar met een chassisnummer bij auto's.",
      },
      {
        label: t("specs.lastMaintenance"),
        value: lastMaintenance
          ? new Date(lastMaintenance).toLocaleDateString()
          : undefined,
        icon: <Wrench size={18} />,
        description:
          "De datum waarop de laatste onderhoudsbeurt is uitgevoerd. Regelmatig onderhoud is belangrijk voor de veiligheid.",
      },
    ].filter((spec) => spec.value !== undefined && spec.value !== null);

    return baseSpecs;
  };

  const specs = createSpecs();

  // If no specs are available, don't render the component
  if (
    specs.length === 0 &&
    dimensionSpecs.length === 0 &&
    capacitySpecs.length === 0
  ) {
    return null;
  }

  return (
    <Card className="border-none shadow-none p-0">
      <h4 className="font-semibold text-lg text-[#222222]">
        {t("specs.title")}
      </h4>
      <CardContent className="p-0">
        <div className="border-b pb-6">
          <h3 className="text-sm font-medium mb-2 text-gray-700">
            {t("specs.type")}
          </h3>
          {/* Main Type Specification */}
          {specs.filter((spec) => spec.label === t("specs.type")).length >
            0 && (
            <div className="mb-4">
              {specs
                .filter((spec) => spec.label === t("specs.type"))
                .map((spec, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 group py-2 rounded-md transition-colors"
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-white">
                      {spec.icon ?? "NIET BESCHIKBAAR"}
                    </div>
                    <div className="flex flex-col">
                      <span className=" text-sm font-medium">
                        {category?.name ?? "NIET BESCHIKBAAR"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Basic Info (Manufacturer, Model, Year) */}
          {specs.filter((spec) =>
            ["Merk", "Model", "Bouwjaar"].includes(spec.label)
          ).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {specs
                .filter((spec) =>
                  ["Merk", "Model", "Bouwjaar"].includes(spec.label)
                )
                .map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 group p-3 rounded-md transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-white group-hover:bg-gray-100">
                      {spec.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium">{spec.value}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Afmetingen Section */}
          {dimensionSpecs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 text-gray-700">
                {t("specs.dimensions")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {dimensionSpecs.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-[#f6f8f9] p-3 rounded-md"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md">
                      {spec.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium">{spec.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capaciteit Section */}
          {capacitySpecs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 text-gray-700">
                {t("specs.capacity")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {capacitySpecs.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-[#f6f8f9] p-3 rounded-md"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md">
                      {spec.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium">{spec.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requiresDriversLicense && <LicenseBanner />}
        </div>
      </CardContent>
    </Card>
  );
}
