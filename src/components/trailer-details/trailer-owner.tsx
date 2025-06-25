"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

interface OwnerInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  memberSince: Date;
}

interface TrailerOwnerProps {
  owner: OwnerInfo;
  responseRate: number | null;
  responseTime: number | null; // in minutes
  joinDate: Date;
}

export default function TrailerOwner({
  owner,
  responseRate,
  responseTime,
  joinDate,
}: TrailerOwnerProps) {
  const { t } = useTranslation("trailer");

  const fullName =
    `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
    t("owner.defaultName");

  // Format join date
  const joinedText = joinDate
    ? t("owner.joined", {
        time: formatDistanceToNow(new Date(joinDate), { addSuffix: true }),
      })
    : "";

  // Format response time
  const formatResponseTime = (minutes: number | null) => {
    if (!minutes) return null;

    if (minutes < 60) {
      return t("owner.respondsInLessThanHour");
    } else if (minutes < 24 * 60) {
      const hours = Math.round(minutes / 60);
      return t("owner.respondsInHours", { count: hours });
    } else {
      const days = Math.round(minutes / (24 * 60));
      return t("owner.respondsInDays", { count: days });
    }
  };

  const responseTimeText = formatResponseTime(responseTime);

  return (
    <Card className="border shadow-none p-4 rounded-xl mt-4">
      <CardContent className="flex items-center p-0">
        {/* Owner profile */}
        <div className="flex items-center gap-4">
          <div className="relative h-11 w-11 rounded-full overflow-hidden bg-gray-200">
            {owner.profilePicture ? (
              <Image
                src={owner.profilePicture}
                alt={fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500 font-semibold">
                {owner.firstName?.[0] || ""}
                {owner.lastName?.[0] || ""}
              </div>
            )}
          </div>

          <div>
            <p className="font-medium text-sm">{fullName}</p>
            <p className="text-[13px] text-gray-500">{joinedText}</p>

            {responseRate && (
              <Badge variant="outline" className="mt-1">
                {t("owner.responseRateValue", {
                  rate: Math.round(responseRate),
                })}
              </Badge>
            )}
          </div>
        </div>

        {/* Response time */}
        {responseTimeText && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-green-600" />
            <span>{responseTimeText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
