"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Ban, Loader2 } from "lucide-react";
import { useLessorCalendarData } from "@/hooks/useLessorCalendarData";
import LessorCalendar from "./LessorCalendar";
import AvailabilitySettings from "./calendar/AvailabilitySettings";
import { useTranslation } from "@/lib/i18n/client";
import MobileLessorCalendar from "./MobileLessorCalendar";

interface CalendarManagementProps {
  userId: string;
}

export default function CalendarManagement({
  userId,
}: CalendarManagementProps) {
  const { t } = useTranslation("profile");
  const [activeTab, setActiveTab] = useState("calendar");

  // Use our calendar data hook
  const { data, isLoading, error, addBlockedPeriod, removeBlockedPeriod } =
    useLessorCalendarData();

  const trailers = data?.trailers || [];
  const rentals = data?.rentals || [];
  const blockedPeriods = data?.blockedPeriods || [];
  const weeklyAvailabilityArray = data?.weeklyAvailabilityData || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight mb-1">
            {t("lessorCalendar.title")}
          </h2>
          <p className="text-muted-foreground text-base">
            {t("lessorCalendar.description")}
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">{t("lessorCalendar.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight mb-1">
            {t("lessorCalendar.title")}
          </h2>
          <p className="text-muted-foreground text-base">
            {t("lessorCalendar.description")}
          </p>
        </div>
        <Card className="border-red-200 shadow-none">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("lessorCalendar.error.title")}
              </h3>
              <p className="text-gray-600 mb-4">
                {error instanceof Error
                  ? error.message
                  : t("lessorCalendar.error.message")}
              </p>
              <Button onClick={() => window.location.reload()}>
                {t("lessorCalendar.error.tryAgain")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#222222] tracking-tight mb-1">
          {t("lessorCalendar.title")}
        </h2>
        <p className="text-muted-foreground text-base">
          {t("lessorCalendar.description")}
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="p-0">
            <TabsList className="w-full bg-white gap-x-2 pb-[25px] mt-2 rounded-0 flex items-center justify-start rounded-none">
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-[#222222] data-[state=active]:shadow-none data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              >
                {t("lessorCalendar.tabs.calendar")}
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="data-[state=active]:bg-[#222222] data-[state=active]:shadow-none data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              >
                {t("lessorCalendar.tabs.availability")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="mt-6 p-0 pt-0">
            <LessorCalendar
              userId={userId}
              trailers={trailers}
              rentals={rentals}
              blockedPeriods={blockedPeriods}
              weeklyAvailability={weeklyAvailabilityArray}
              onAddBlockedPeriod={addBlockedPeriod}
              onRemoveBlockedPeriod={removeBlockedPeriod}
            />
          </TabsContent>

          <TabsContent value="availability" className="mt-6 p-0 pt-0">
            <AvailabilitySettings
              userId={userId}
              trailers={trailers}
              weeklyAvailabilityData={weeklyAvailabilityArray}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
