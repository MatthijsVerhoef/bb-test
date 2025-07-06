// components/calendar/DesktopCalendarView.tsx

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  getDay,
  startOfDay,
  isBefore,
  isAfter,
} from "date-fns";
import { nl, de, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { useCalendarData } from "@/hooks/useCalendarData";
import { Day } from "./Day";
import { RentalDetailsPopup } from "./RentalDetailsPopup";
import type { CalendarProps, Rental } from "@/types/Calendar";

interface DesktopCalendarViewProps extends CalendarProps {
  selectedTrailer: string;
}

export const DesktopCalendarView: React.FC<DesktopCalendarViewProps> = ({
  selectedTrailer,
  trailers,
  rentals,
  blockedPeriods,
  weeklyAvailability,
  userId,
  onAddBlockedPeriod,
  onRemoveBlockedPeriod,
}) => {
  const { t } = useTranslation("profile");
  const { t: tCommon } = useTranslation("common");

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showRentalPopup, setShowRentalPopup] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [mouseDownTime, setMouseDownTime] = useState<number>(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Define date limits
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const maxFutureMonth = addMonths(currentMonthStart, 6);
  const maxPastMonth = subMonths(currentMonthStart, 4);

  // Check if we can navigate
  const canGoBack = currentMonth > maxPastMonth;
  const canGoForward = currentMonth < maxFutureMonth;

  const { isInBlockedPeriod, getDateRentals, getDateStatus } = useCalendarData({
    selectedTrailer,
    weeklyAvailability,
    blockedPeriods,
    rentals,
  });

  const DAY_NAMES = [
    t("lessorCalendar.availability.shortDays.MONDAY"),
    t("lessorCalendar.availability.shortDays.TUESDAY"),
    t("lessorCalendar.availability.shortDays.WEDNESDAY"),
    t("lessorCalendar.availability.shortDays.THURSDAY"),
    t("lessorCalendar.availability.shortDays.FRIDAY"),
    t("lessorCalendar.availability.shortDays.SATURDAY"),
    t("lessorCalendar.availability.shortDays.SUNDAY"),
  ];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    const firstDayOfWeek = getDay(firstDay);
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const emptyDays = Array(paddingDays).fill(null);

    return [...emptyDays, ...days];
  }, [currentMonth]);

  // Check if a date is in the drag selection range
  const isInDragRange = useCallback(
    (date: Date) => {
      if (!isDragging || !dragStartDate || !dragEndDate) return false;

      const start = isBefore(dragStartDate, dragEndDate)
        ? dragStartDate
        : dragEndDate;
      const end = isAfter(dragStartDate, dragEndDate)
        ? dragStartDate
        : dragEndDate;

      return (
        (isAfter(date, start) || isSameDay(date, start)) &&
        (isBefore(date, end) || isSameDay(date, end))
      );
    },
    [isDragging, dragStartDate, dragEndDate]
  );

  // Handle date click - modified to handle rentals
  const handleDateClick = useCallback(
    (date: Date) => {
      const normalizedDate = startOfDay(date);
      const dateRentals = getDateRentals(normalizedDate);

      // If there are rentals, show the rental popup
      if (dateRentals.length > 0) {
        setSelectedRental(dateRentals[0]); // Show the first rental
        setShowRentalPopup(true);
        return;
      }

      // Otherwise, proceed with normal selection logic
      // Don't allow selection of past dates
      if (isBefore(normalizedDate, startOfDay(new Date()))) return;

      // Toggle selection
      setSelectedDates((prev) => {
        const isSelected = prev.some((d) => isSameDay(d, normalizedDate));

        if (isSelected) {
          return prev.filter((d) => !isSameDay(d, normalizedDate));
        } else {
          return [...prev, normalizedDate];
        }
      });
    },
    [getDateRentals]
  );

  // Handle mouse down - modified to not start drag on rental dates
  const handleMouseDown = useCallback(
    (date: Date) => {
      const normalizedDate = startOfDay(date);
      const dateRentals = getDateRentals(normalizedDate);

      // If clicking on a rental date, handle it as a click
      if (dateRentals.length > 0) {
        handleDateClick(date);
        return;
      }

      // Don't allow selection of past dates
      if (isBefore(normalizedDate, startOfDay(new Date()))) return;

      setMouseDownTime(Date.now());
      setDragStartDate(normalizedDate);
      setDragEndDate(normalizedDate);
    },
    [getDateRentals, handleDateClick]
  );

  // Handle mouse enter (for drag)
  const handleMouseEnter = useCallback(
    (date: Date) => {
      if (!dragStartDate) return;

      const timeSinceMouseDown = Date.now() - mouseDownTime;

      // Consider it a drag if mouse has been down for more than 200ms or moved to different date
      if (timeSinceMouseDown > 200 || !isSameDay(date, dragStartDate)) {
        if (!isDragging) {
          setIsDragging(true);
          // Clear existing selection when starting drag
          setSelectedDates([]);
        }
        setDragEndDate(startOfDay(date));
      }
    },
    [dragStartDate, mouseDownTime, isDragging]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(
    (date: Date) => {
      const normalizedDate = startOfDay(date);
      const timeSinceMouseDown = Date.now() - mouseDownTime;

      if (
        !isDragging &&
        timeSinceMouseDown < 200 &&
        dragStartDate &&
        isSameDay(dragStartDate, normalizedDate)
      ) {
        // It's a click, not a drag
        handleDateClick(date);
      } else if (isDragging && dragStartDate && dragEndDate) {
        // It's a drag - add the range
        const start = isBefore(dragStartDate, dragEndDate)
          ? dragStartDate
          : dragEndDate;
        const end = isAfter(dragStartDate, dragEndDate)
          ? dragStartDate
          : dragEndDate;

        // Check if all dates in range are valid
        const datesInRange = eachDayOfInterval({ start, end });
        const validDates = datesInRange.filter(
          (d) =>
            getDateRentals(d).length === 0 &&
            !isBefore(d, startOfDay(new Date()))
        );

        setSelectedDates(validDates);
      }

      // Reset drag state
      setIsDragging(false);
      setDragStartDate(null);
      setDragEndDate(null);
    },
    [
      isDragging,
      mouseDownTime,
      dragStartDate,
      dragEndDate,
      getDateRentals,
      handleDateClick,
    ]
  );

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStartDate && dragEndDate) {
        const start = isBefore(dragStartDate, dragEndDate)
          ? dragStartDate
          : dragEndDate;
        const end = isAfter(dragStartDate, dragEndDate)
          ? dragStartDate
          : dragEndDate;

        const datesInRange = eachDayOfInterval({ start, end });
        const validDates = datesInRange.filter(
          (d) =>
            getDateRentals(d).length === 0 &&
            !isBefore(d, startOfDay(new Date()))
        );

        setSelectedDates(validDates);
      }

      setIsDragging(false);
      setDragStartDate(null);
      setDragEndDate(null);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStartDate, dragEndDate, getDateRentals]);

  // Block/unblock handlers
  const handleBlockDates = async () => {
    if (selectedDates.length === 0 || !selectedTrailer || actionInProgress)
      return;

    const sortedDates = [...selectedDates].sort(
      (a, b) => a.getTime() - b.getTime()
    );
    setActionInProgress(true);

    try {
      await onAddBlockedPeriod({
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
        trailerId: selectedTrailer,
        userId,
      });

      setSelectedDates([]);
    } catch (error) {
      console.error("Failed to block dates:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnblockDates = async () => {
    if (selectedDates.length === 0 || actionInProgress) return;

    setActionInProgress(true);

    try {
      // Group selected dates by the blocked period they belong to
      const periodsToProcess = new Map<
        string,
        { period: any; datesToUnblock: Date[] }
      >();

      selectedDates.forEach((date) => {
        const blockedPeriod = isInBlockedPeriod(date);
        if (blockedPeriod) {
          if (!periodsToProcess.has(blockedPeriod.id)) {
            periodsToProcess.set(blockedPeriod.id, {
              period: blockedPeriod,
              datesToUnblock: [],
            });
          }
          periodsToProcess.get(blockedPeriod.id)!.datesToUnblock.push(date);
        }
      });

      // Process each affected period
      for (const [periodId, { period, datesToUnblock }] of periodsToProcess) {
        const periodStart = startOfDay(new Date(period.startDate));
        const periodEnd = startOfDay(new Date(period.endDate));

        // Sort dates to unblock
        datesToUnblock.sort((a, b) => a.getTime() - b.getTime());

        // Check if we're unblocking all dates in the period
        const allDatesInPeriod = [];
        let currentDate = new Date(periodStart);
        while (currentDate <= periodEnd) {
          allDatesInPeriod.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const unblockingAllDates = allDatesInPeriod.every((date) =>
          datesToUnblock.some((d) => isSameDay(d, date))
        );

        if (unblockingAllDates) {
          // Remove the entire period
          await onRemoveBlockedPeriod(periodId);
        } else {
          // Create new periods for the dates that remain blocked
          const remainingBlockedRanges: Array<{ start: Date; end: Date }> = [];
          let rangeStart: Date | null = null;

          allDatesInPeriod.forEach((date, index) => {
            const isUnblocked = datesToUnblock.some((d) => isSameDay(d, date));

            if (!isUnblocked) {
              if (!rangeStart) {
                rangeStart = new Date(date);
              }
            } else if (rangeStart) {
              // End the current range
              const rangeEnd = new Date(allDatesInPeriod[index - 1]);
              remainingBlockedRanges.push({ start: rangeStart, end: rangeEnd });
              rangeStart = null;
            }
          });

          // Handle the last range if it exists
          if (rangeStart) {
            remainingBlockedRanges.push({
              start: rangeStart,
              end: new Date(allDatesInPeriod[allDatesInPeriod.length - 1]),
            });
          }

          // Remove the original period
          await onRemoveBlockedPeriod(periodId);

          // Create new periods for remaining blocked ranges
          for (const range of remainingBlockedRanges) {
            await onAddBlockedPeriod({
              startDate: range.start,
              endDate: range.end,
              reason: period.reason,
              trailerId: period.trailerId,
              userId,
            });
          }
        }
      }

      setSelectedDates([]);
    } catch (error) {
      console.error("Failed to unblock dates:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Calculate selected dates status
  const selectedDatesStatus = useMemo(() => {
    if (selectedDates.length === 0)
      return { canBlock: 0, canUnblock: 0, isBlocked: false };

    const blockedCount = selectedDates.filter((date) =>
      isInBlockedPeriod(date)
    ).length;
    const availableCount = selectedDates.length - blockedCount;
    const isBlocked =
      blockedCount === selectedDates.length && availableCount === 0;

    return { canBlock: availableCount, canUnblock: blockedCount, isBlocked };
  }, [selectedDates, isInBlockedPeriod]);

  // Toggle function that automatically chooses block or unblock
  const handleToggleSelectedDates = useCallback(async () => {
    if (selectedDatesStatus.isBlocked) {
      await handleUnblockDates();
    } else {
      await handleBlockDates();
    }
  }, [selectedDatesStatus.isBlocked, handleBlockDates, handleUnblockDates]);

  return (
    <Card className="p-0 border-0">
      {selectedDates.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-col items-start justify-between mb-4">
            {/* Show selected dates count and action buttons when dates are selected */}
            <div className="flex flex-row items-center bg-gray-100 p-2 w-full mt-6 rounded-xl gap-3 ms-auto">
              <div className="flex me-auto items-center gap-2 bg-[#222222] text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-white">
                  {t(
                    selectedDates.length === 1
                      ? "lessorCalendar.calendar.mobile.daysSelected"
                      : "lessorCalendar.calendar.mobile.daysSelectedPlural",
                    { count: selectedDates.length }
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDates([])}
                  className="h-5 w-5 ml-1"
                  disabled={actionInProgress}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center rounded-xl">
                <span className="text-sm font-medium">Beschikbaar:</span>
                <div className="relative ms-2 grid grid-cols-2 gap-1 h-full bg-[#222222] rounded-full p-1">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 text-[13px] py-3 px-3 rounded-full transition-colors duration-300 z-10 ${
                      selectedDatesStatus.isBlocked
                        ? "text-white font-medium"
                        : "bg-white text-green-400"
                    }`}
                    onClick={handleToggleSelectedDates}
                    disabled={actionInProgress}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 text-[13px] py-2 px-3 rounded-full transition-colors duration-300 z-10 ${
                      !selectedDatesStatus.isBlocked
                        ? "text-white font-medium"
                        : "text-red-400 bg-white"
                    }`}
                    onClick={handleToggleSelectedDates}
                    disabled={actionInProgress}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex mt-6 items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="bg-[#F7F7F7] rounded-full"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
          disabled={!canGoBack}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <h2 className="text-xl font-semibold flex items-center gap-2">
          {format(currentMonth, "MMMM yyyy", {
            locale:
              tCommon("locale") === "nl"
                ? nl
                : tCommon("locale") === "de"
                ? de
                : enUS,
          })}
        </h2>

        <Button
          variant="ghost"
          size="icon"
          className="bg-[#F7F7F7] rounded-full"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          disabled={!canGoForward}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        ref={calendarRef}
        className="grid grid-cols-7 gap-1 md:gap-2 select-none"
        onMouseLeave={() => {
          if (isDragging) {
            setDragEndDate(dragStartDate);
          }
        }}
      >
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isSelected = selectedDates.some((d) => isSameDay(d, date));
          const isInRange = isInDragRange(date);

          return (
            <div
              key={date.toISOString()}
              onMouseDown={() => handleMouseDown(date)}
              onMouseEnter={() => handleMouseEnter(date)}
              onMouseUp={() => handleMouseUp(date)}
              className="cursor-pointer"
            >
              <Day
                date={date}
                monthDate={currentMonth}
                status={getDateStatus(date)}
                rentals={getDateRentals(date)}
                isSelected={isSelected || isInRange}
                isPast={date < new Date() && !isToday(date)}
                onSelect={() => {}} // We handle selection in the parent div
                disabled={false}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-gray-100 p-3 rounded-lg mt-4">
        <span className="font-medium text-gray-700">
          {t("lessorCalendar.calendar.legend.title")}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white border border-gray-200 rounded" />
          <span>{t("lessorCalendar.calendar.legend.available")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded" />
          <span>{t("lessorCalendar.calendar.legend.unavailable")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
          <span>{t("lessorCalendar.calendar.legend.blocked")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/20 border border-primary rounded" />
          <span>{t("lessorCalendar.calendar.legend.booked")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-primary rounded" />
          <span>{t("lessorCalendar.calendar.legend.today")}</span>
        </div>
      </div>

      {/* Rental Details Popup */}
      <RentalDetailsPopup
        rental={selectedRental}
        isOpen={showRentalPopup}
        onClose={() => {
          setShowRentalPopup(false);
          setSelectedRental(null);
        }}
      />
    </Card>
  );
};
