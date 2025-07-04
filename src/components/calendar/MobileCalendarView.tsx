// components/calendar/MobileCalendarView.tsx

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isSameDay,
  getDay,
  subMonths,
  startOfDay,
  isAfter,
  isBefore,
} from "date-fns";
import { nl, de, enUS } from "date-fns/locale";
import { ChevronLeft, Settings, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { useCalendarData } from "@/hooks/useCalendarData";
import { Day } from "./Day";
import type { BlockedPeriod, CalendarProps } from "@/types/Calendar";

interface MobileCalendarViewProps extends CalendarProps {
  selectedTrailer: string;
  onBack: () => void;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  selectedTrailer,
  trailers,
  rentals,
  blockedPeriods,
  weeklyAvailability,
  userId,
  onBack,
  onAddBlockedPeriod,
  onRemoveBlockedPeriod,
}) => {
  const { t } = useTranslation("profile");
  const { t: tCommon } = useTranslation("common");

  const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Touch drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const loadingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrailer = useMemo(
    () => trailers.find((t) => t.id === selectedTrailer),
    [trailers, selectedTrailer]
  );

  const { isInBlockedPeriod, getDateRentals, getDateStatus } = useCalendarData({
    selectedTrailer,
    weeklyAvailability,
    blockedPeriods,
    rentals,
  });

  // Initialize visible months
  useEffect(() => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    setVisibleMonths([
      subMonths(currentMonth, 1),
      currentMonth,
      addMonths(currentMonth, 1),
    ]);
  }, []);

  // Scroll to current month on mount
  useEffect(() => {
    if (visibleMonths.length === 3 && scrollContainerRef.current) {
      const currentMonth = startOfMonth(new Date());
      const currentMonthKey = format(currentMonth, "yyyy-MM");

      const timeoutId = setTimeout(() => {
        if (monthRefs.current[currentMonthKey]) {
          monthRefs.current[currentMonthKey]?.scrollIntoView({
            behavior: "auto",
            block: "start",
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [visibleMonths.length]);

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

  // Improved scroll handler with date limits (4 months past, 6 months future)
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (loadingRef.current || !scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;

      const today = new Date();
      const currentMonthStart = startOfMonth(today);
      const maxFutureMonth = addMonths(currentMonthStart, 6); // 6 months into future
      const maxPastMonth = subMonths(currentMonthStart, 4); // 4 months into past

      // Load more months when near bottom
      if (scrollHeight - scrollTop - clientHeight < 500) {
        loadingRef.current = true;
        setIsLoading(true);

        setVisibleMonths((prev) => {
          const lastMonth = prev[prev.length - 1];

          // Check if we've reached the future limit
          if (lastMonth >= maxFutureMonth) {
            setTimeout(() => {
              setIsLoading(false);
              loadingRef.current = false;
            }, 100);
            return prev;
          }

          // Calculate how many months we can add without exceeding the limit
          const monthsToAdd = [];
          for (let i = 1; i <= 3; i++) {
            const newMonth = addMonths(lastMonth, i);
            if (newMonth <= maxFutureMonth) {
              monthsToAdd.push(newMonth);
            }
          }

          if (monthsToAdd.length > 0) {
            setTimeout(() => {
              setIsLoading(false);
              loadingRef.current = false;
            }, 100);
            return [...prev, ...monthsToAdd];
          }

          setTimeout(() => {
            setIsLoading(false);
            loadingRef.current = false;
          }, 100);
          return prev;
        });
      }

      // Load previous months when near top
      if (scrollTop < 500 && !loadingRef.current) {
        const firstVisibleElement = document.elementFromPoint(
          container.getBoundingClientRect().left + 50,
          container.getBoundingClientRect().top + 100
        );

        let referenceTop = 0;
        if (firstVisibleElement) {
          referenceTop = firstVisibleElement.getBoundingClientRect().top;
        }

        loadingRef.current = true;
        setIsLoading(true);

        setVisibleMonths((prev) => {
          const firstMonth = prev[0];

          // Check if we've reached the past limit
          if (firstMonth <= maxPastMonth) {
            setTimeout(() => {
              setIsLoading(false);
              loadingRef.current = false;
            }, 100);
            return prev;
          }

          // Calculate how many months we can add without exceeding the limit
          const newMonths = Array.from({ length: 3 }, (_, i) =>
            subMonths(firstMonth, 3 - i)
          ).filter((month) => month >= maxPastMonth);

          if (newMonths.length > 0) {
            requestAnimationFrame(() => {
              if (firstVisibleElement && scrollContainerRef.current) {
                const newTop = firstVisibleElement.getBoundingClientRect().top;
                const diff = newTop - referenceTop;
                scrollContainerRef.current.scrollTop += diff;
              }
              setIsLoading(false);
              loadingRef.current = false;
            });

            return [...newMonths, ...prev];
          }

          setTimeout(() => {
            setIsLoading(false);
            loadingRef.current = false;
          }, 100);
          return prev;
        });
      }
    }, 50) as NodeJS.Timeout;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Date element finder for touch events
  const getDateElementFromPoint = useCallback(
    (x: number, y: number): Date | null => {
      const element = document.elementFromPoint(x, y);
      if (element) {
        const dateElement = element.closest("[data-date]");
        if (dateElement) {
          const dateStr = dateElement.getAttribute("data-date");
          if (dateStr) {
            return new Date(dateStr);
          }
        }
      }
      return null;
    },
    []
  );

  // Handle touch start
  const handleTouchStart = useCallback(
    (date: Date, e: React.TouchEvent) => {
      const normalizedDate = startOfDay(date);

      // Don't allow selection of dates with rentals or past dates
      if (getDateRentals(normalizedDate).length > 0) return;
      if (isBefore(normalizedDate, startOfDay(new Date()))) return;

      const touch = e.touches[0];
      setTouchStartTime(Date.now());
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      setDragStartDate(normalizedDate);
      setDragEndDate(normalizedDate);
    },
    [getDateRentals]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragStartDate || !touchStartPosRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

      // Start dragging if moved more than 10 pixels
      if ((deltaX > 10 || deltaY > 10) && !isDragging) {
        setIsDragging(true);
        // Clear previous selection when starting drag
        setSelectedDates([]);
      }

      if (isDragging) {
        const date = getDateElementFromPoint(touch.clientX, touch.clientY);
        if (date) {
          setDragEndDate(date);
        }
      }
    },
    [dragStartDate, isDragging, getDateElementFromPoint]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchStartTime;

    if (!isDragging && touchDuration < 300 && dragStartDate) {
      // It's a tap, not a drag
      const normalizedDate = startOfDay(dragStartDate);

      setSelectedDates((prev) => {
        const isSelected = prev.some((d) => isSameDay(d, normalizedDate));

        if (isSelected) {
          return prev.filter((d) => !isSameDay(d, normalizedDate));
        } else {
          return [...prev, normalizedDate];
        }
      });
    } else if (isDragging && dragStartDate && dragEndDate) {
      // It's a drag
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
          getDateRentals(d).length === 0 && !isBefore(d, startOfDay(new Date()))
      );

      setSelectedDates(validDates);
    }

    setIsDragging(false);
    setDragStartDate(null);
    setDragEndDate(null);
    touchStartPosRef.current = null;
  }, [touchStartTime, dragStartDate, dragEndDate, isDragging, getDateRentals]);

  // Block/unblock operations
  const handleBlockDates = useCallback(async () => {
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
  }, [
    selectedDates,
    selectedTrailer,
    userId,
    onAddBlockedPeriod,
    actionInProgress,
  ]);

  const handleUnblockDates = useCallback(async () => {
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
  }, [
    selectedDates,
    isInBlockedPeriod,
    onRemoveBlockedPeriod,
    onAddBlockedPeriod,
    actionInProgress,
    userId,
  ]);

  const selectedDatesStatus = useMemo(() => {
    if (selectedDates.length === 0) {
      return { canBlock: 0, canUnblock: 0, isBlocked: false };
    }

    const blockedCount = selectedDates.filter((date) =>
      isInBlockedPeriod(date)
    ).length;
    const availableCount = selectedDates.length - blockedCount;
    const isBlocked =
      blockedCount === selectedDates.length && availableCount === 0;

    return { canBlock: availableCount, canUnblock: blockedCount, isBlocked };
  }, [selectedDates, isInBlockedPeriod]);

  const handleToggleSelectedDates = useCallback(async () => {
    if (selectedDatesStatus.isBlocked) {
      await handleUnblockDates();
    } else {
      await handleBlockDates();
    }
  }, [selectedDatesStatus.isBlocked, handleBlockDates, handleUnblockDates]);

  // Month rendering
  const renderMonth = useCallback(
    (monthDate: Date) => {
      const monthKey = format(monthDate, "yyyy-MM");
      const firstDay = startOfMonth(monthDate);
      const lastDay = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start: firstDay, end: lastDay });

      // Calculate padding for the first week
      const firstDayOfWeek = getDay(firstDay);
      const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

      return (
        <div
          key={monthKey}
          ref={(el) => (monthRefs.current[monthKey] = el)}
          className="mb-6"
        >
          <div className="pb-2 ps-4 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(monthDate, "MMMM yyyy", {
                locale:
                  tCommon("locale") === "nl"
                    ? nl
                    : tCommon("locale") === "de"
                    ? de
                    : enUS,
              })}
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-1 select-none">
            {/* Add empty cells for padding */}
            {Array.from({ length: paddingDays }).map((_, index) => (
              <div key={`empty-${index}`} className="h-[70px]" />
            ))}

            {/* Render only current month days */}
            {days.map((date) => {
              const isSelected = selectedDates.some((d) => isSameDay(d, date));
              const isInRange = isInDragRange(date);

              return (
                <div
                  key={date.toISOString()}
                  data-date={date.toISOString()}
                  onTouchStart={(e) => handleTouchStart(date, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="cursor-pointer touch-none"
                >
                  <Day
                    date={date}
                    monthDate={monthDate}
                    status={getDateStatus(date)}
                    rentals={getDateRentals(date)}
                    isSelected={isSelected || isInRange}
                    isPast={isBefore(date, startOfDay(new Date()))}
                    onSelect={() => {}} // We handle selection in the parent div
                    isMobile
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [
      getDateStatus,
      getDateRentals,
      selectedDates,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      isInDragRange,
      tCommon,
    ]
  );

  return (
    <div className="fixed z-[100] inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-8 h-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{currentTrailer?.title}</h1>
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Day Names */}
      <div className="bg-white border-b px-4 py-2">
        <div className="grid grid-cols-7 gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <div
              key={dayIndex}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {t(`lessorCalendar.availability.mobileDays.${dayIndex}`)}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Calendar */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {visibleMonths.map((monthDate) => renderMonth(monthDate))}

        {/* Show loading or limit message */}
        {visibleMonths.length > 0 &&
        visibleMonths[visibleMonths.length - 1] >=
          addMonths(startOfMonth(new Date()), 6) ? null : isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-pulse text-gray-400 text-sm">
              {t("lessorCalendar.calendar.mobile.loadingMore")}
            </div>
          </div>
        ) : null}
      </div>

      {/* Action Popup */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white from-60% to-transparent border-0 transition-all duration-300 ease-in-out",
          selectedDates.length > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        )}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-end mb-3">
            <div className="flex items-center me-2 gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-900">
                {t(
                  selectedDates.length === 1
                    ? "lessorCalendar.calendar.mobile.daysSelected"
                    : "lessorCalendar.calendar.mobile.daysSelectedPlural",
                  { count: selectedDates.length }
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDates([])}
              className="text-xs px-2 py-1 bg-gray-100 rounded-full"
              disabled={actionInProgress}
            >
              <X />
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="rounded-xl ms-auto relative flex flex-col py-2 ps-5 pe-4 w-fit bg-gray-100 text-[12px] font-medium">
              <div className="w-full flex items-center justify-end">
                <p>Beschikbaar:</p>
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
      </div>

      {/* Legend */}
      {selectedDates.length === 0 && (
        <div className="bg-white border-t px-4 py-2">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white border border-gray-200 rounded" />
              <span>{t("lessorCalendar.calendar.legend.available")}</span>
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
              <div className="w-3 h-3 bg-primary rounded" />
              <span>{t("lessorCalendar.calendar.legend.today")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
