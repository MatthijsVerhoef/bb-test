import {
  addDays,
  isSameDay,
  isAfter,
  isBefore,
  format,
  getDay,
} from "date-fns";
import { nl, enUS, de } from "date-fns/locale";

export interface WeeklyAvailability {
  id?: string;
  day: string;
  available: boolean;
  timeSlot1Start: string | null;
  timeSlot1End: string | null;
  timeSlot2Start: string | null;
  timeSlot2End: string | null;
  timeSlot3Start: string | null;
  timeSlot3End: string | null;
  trailerId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AvailabilityException {
  id: string;
  date: string | Date;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  morningStart?: string | null;
  morningEnd?: string | null;
  afternoonStart?: string | null;
  afternoonEnd?: string | null;
  eveningStart?: string | null;
  eveningEnd?: string | null;
}

export interface ExistingRental {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  pickupTime?: string;
  returnTime?: string;
}

export interface BlockedPeriod {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  trailerId?: string | null;
  allDay?: boolean;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  belongsToThisTrailersOwner?: boolean;
  isGlobal?: boolean;
  trailerSpecific?: boolean;
  userId?: string;
  isTemporaryBlock?: boolean;
  isConfirmedRental?: boolean;
}

export const DAY_MAP = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export function isDateDisabled(
  date: Date,
  {
    weeklyAvailability = [],
    availabilityExceptions = [],
    existingRentals = [],
    blockedPeriods = [],
    minRentalDuration = 1,
    maxRentalDuration,
    currentlySelectedStartDate,
    currentlySelectedEndDate,
  }: {
    weeklyAvailability?: WeeklyAvailability[];
    availabilityExceptions?: AvailabilityException[];
    existingRentals?: ExistingRental[];
    blockedPeriods?: BlockedPeriod[];
    minRentalDuration?: number | null;
    maxRentalDuration?: number | null;
    currentlySelectedStartDate?: Date;
    currentlySelectedEndDate?: Date;
  }
): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isBefore(checkDate, today)) {
    return true;
  }

  if (isDateInExistingRental(checkDate, existingRentals)) {
    return true;
  }

  if (blockedPeriods && blockedPeriods.length > 0) {
    const trailerId =
      blockedPeriods.find((bp) => bp.trailerId)?.trailerId || undefined;

    const isBlocked = isDateInBlockedPeriod(
      checkDate,
      blockedPeriods,
      trailerId || undefined
    );
    if (isBlocked) {
      return true;
    }
  }

  const exception = findAvailabilityException(
    checkDate,
    availabilityExceptions
  );
  if (exception) {
    if (!exception.morning && !exception.afternoon && !exception.evening) {
      return true;
    }
    return false;
  }

  if (!isDateAvailableInWeeklySchedule(checkDate, weeklyAvailability)) {
    return true;
  }

  if (currentlySelectedStartDate && !currentlySelectedEndDate) {
    if (isBefore(checkDate, currentlySelectedStartDate)) {
      return true;
    }

    if (maxRentalDuration) {
      const maxEndDate = addDays(
        currentlySelectedStartDate,
        maxRentalDuration - 1
      );
      if (isAfter(checkDate, maxEndDate)) {
        return true;
      }
    }

    if (
      minRentalDuration &&
      minRentalDuration > 1 &&
      !isSameDay(checkDate, currentlySelectedStartDate)
    ) {
      const minEndDate = addDays(
        currentlySelectedStartDate,
        minRentalDuration - 1
      );
      if (isBefore(checkDate, minEndDate)) {
        if (!isSameDay(checkDate, currentlySelectedStartDate)) {
          return true;
        }
      }
    }

    if (
      areAnyDatesUnavailableBetween(currentlySelectedStartDate, checkDate, {
        weeklyAvailability,
        availabilityExceptions,
        existingRentals,
        blockedPeriods,
      })
    ) {
      if (!isSameDay(checkDate, currentlySelectedStartDate)) {
        return true;
      }
    }
  }

  if (currentlySelectedStartDate && currentlySelectedEndDate) {
    if (
      !isSameDay(checkDate, currentlySelectedStartDate) &&
      !isSameDay(checkDate, currentlySelectedEndDate) &&
      (isBefore(checkDate, currentlySelectedStartDate) ||
        isAfter(checkDate, currentlySelectedEndDate))
    ) {
      return false;
    }
  }

  return false;
}

function isDateInExistingRental(
  date: Date,
  existingRentals: ExistingRental[]
): boolean {
  return existingRentals.some((rental) => {
    if (!["CONFIRMED", "ACTIVE"].includes(rental.status)) {
      return false;
    }

    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);

    return (
      (isSameDay(date, startDate) || isAfter(date, startDate)) &&
      (isSameDay(date, endDate) || isBefore(date, endDate))
    );
  });
}

export function isDateInBlockedPeriod(
  date: Date,
  blockedPeriods: BlockedPeriod[],
  currentTrailerId?: string
): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (!blockedPeriods || blockedPeriods.length === 0) {
    return false;
  }

  const isBlocked = blockedPeriods.some((period) => {
    if (period.trailerId !== null && period.trailerId !== currentTrailerId) {
      return false;
    }

    if (period.trailerId === null && !period.belongsToThisTrailersOwner) {
      return false;
    }

    let startDate: Date;
    let endDate: Date;

    try {
      startDate =
        period.startDate instanceof Date
          ? new Date(period.startDate)
          : new Date(period.startDate);

      endDate =
        period.endDate instanceof Date
          ? new Date(period.endDate)
          : new Date(period.endDate);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const isInRange =
        (isSameDay(checkDate, startDate) || isAfter(checkDate, startDate)) &&
        (isSameDay(checkDate, endDate) || isBefore(checkDate, endDate));

      return isInRange;
    } catch (error) {
      return false;
    }
  });

  return isBlocked;
}

function findAvailabilityException(
  date: Date,
  availabilityExceptions: AvailabilityException[]
): AvailabilityException | undefined {
  return availabilityExceptions.find((exception) => {
    const exceptionDate = new Date(exception.date);
    return isSameDay(date, exceptionDate);
  });
}

function isDateAvailableInWeeklySchedule(
  date: Date,
  weeklyAvailability: WeeklyAvailability[]
): boolean {
  if (!weeklyAvailability || weeklyAvailability.length === 0) {
    return true;
  }

  const dayOfWeek = getDay(date);
  const day = DAY_MAP[dayOfWeek as keyof typeof DAY_MAP];

  const dayAvailability = weeklyAvailability.find((a) => a.day === day);

  if (!dayAvailability) {
    return false;
  }

  return dayAvailability.available === true;
}

function areAnyDatesUnavailableBetween(
  startDate: Date,
  endDate: Date,
  {
    weeklyAvailability,
    availabilityExceptions,
    existingRentals,
    blockedPeriods,
  }: {
    weeklyAvailability: WeeklyAvailability[];
    availabilityExceptions: AvailabilityException[];
    existingRentals: ExistingRental[];
    blockedPeriods?: BlockedPeriod[];
  }
): boolean {
  const normalizedStartDate = new Date(startDate);
  normalizedStartDate.setHours(0, 0, 0, 0);

  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setHours(0, 0, 0, 0);

  let currentDate = new Date(normalizedStartDate);

  const trailerId =
    blockedPeriods && blockedPeriods.length > 0
      ? blockedPeriods.find((bp) => bp.trailerId)?.trailerId || undefined
      : undefined;

  while (
    isBefore(currentDate, normalizedEndDate) ||
    isSameDay(currentDate, normalizedEndDate)
  ) {
    if (isDateInExistingRental(currentDate, existingRentals)) {
      return true;
    }

    if (blockedPeriods && blockedPeriods.length > 0) {
      if (isDateInBlockedPeriod(currentDate, blockedPeriods, trailerId)) {
        return true;
      }
    }

    if (
      !isDateAvailableAccordingToSchedule(
        currentDate,
        weeklyAvailability,
        availabilityExceptions
      )
    ) {
      return true;
    }

    currentDate = addDays(currentDate, 1);
  }

  return false;
}

function isDateAvailableAccordingToSchedule(
  date: Date,
  weeklyAvailability: WeeklyAvailability[],
  availabilityExceptions: AvailabilityException[]
): boolean {
  const exception = findAvailabilityException(date, availabilityExceptions);
  if (exception) {
    return exception.morning || exception.afternoon || exception.evening;
  }

  return isDateAvailableInWeeklySchedule(date, weeklyAvailability);
}

export async function fetchAvailabilityData(
  trailerId: string,
  range: "currentMonth" | "threeMonths" | "all" = "threeMonths"
): Promise<{
  rentals: ExistingRental[];
  availabilityExceptions: AvailabilityException[];
  weeklyAvailability: WeeklyAvailability[];
  blockedPeriods: BlockedPeriod[];
}> {
  try {
    if (
      typeof window !== "undefined" &&
      window.__TRAILER_DATA &&
      window.__TRAILER_DATA[trailerId]?._availabilityData
    ) {
      return window.__TRAILER_DATA[trailerId]._availabilityData;
    }

    const response = await fetch(
      `/api/trailers/${trailerId}/availability?range=${range}`,
      {
        next: {
          revalidate: 300,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch availability data: ${response.status}`);
    }

    const data = await response.json();

    if (typeof window !== "undefined") {
      window.__TRAILER_DATA = window.__TRAILER_DATA || {};
      window.__TRAILER_DATA[trailerId] = window.__TRAILER_DATA[trailerId] || {};
      window.__TRAILER_DATA[trailerId]._availabilityData = data;
    }

    return {
      rentals: data.rentals || [],
      availabilityExceptions: data.availabilityExceptions || [],
      weeklyAvailability: data.weeklyAvailability || [],
      blockedPeriods: data.blockedPeriods || [],
    };
  } catch (error) {
    return {
      rentals: [],
      availabilityExceptions: [],
      weeklyAvailability: [],
      blockedPeriods: [],
    };
  }
}

export function getAvailableTimeOptions(
  date: Date,
  weeklyAvailability: WeeklyAvailability[] = [],
  availabilityExceptions: AvailabilityException[] = []
): string[] {
  if (!date) {
    return [];
  }

  const exception = findAvailabilityException(date, availabilityExceptions);
  if (exception) {
    return generateTimeOptionsFromException(exception);
  }

  if (weeklyAvailability && weeklyAvailability.length > 0) {
    const dayOfWeek = getDay(date);
    const day = DAY_MAP[dayOfWeek as keyof typeof DAY_MAP];
    const dayAvailability = weeklyAvailability.find((a) => a.day === day);

    if (dayAvailability) {
      if (dayAvailability.available === false) {
        return [];
      }

      const timeOptions =
        generateTimeOptionsFromWeeklyAvailability(dayAvailability);
      return timeOptions;
    }
  }

  return [];
}

function generateTimeOptionsFromWeeklyAvailability(
  availability: WeeklyAvailability
): string[] {
  const availableTimeSlots: string[] = [];

  if (availability.available === false) {
    return [];
  }

  const slots = [
    { start: availability.timeSlot1Start, end: availability.timeSlot1End },
    { start: availability.timeSlot2Start, end: availability.timeSlot2End },
    { start: availability.timeSlot3Start, end: availability.timeSlot3End },
  ];

  let hasValidSlots = false;

  for (const slot of slots) {
    if (
      slot.start &&
      slot.end &&
      slot.start !== "null" &&
      slot.end !== "null"
    ) {
      hasValidSlots = true;
      availableTimeSlots.push(
        ...generateTimeSlotsInRange(slot.start, slot.end)
      );
    }
  }

  if (!hasValidSlots && availability.available === true) {
    return [];
  }

  return [...new Set(availableTimeSlots)].sort();
}

function generateTimeOptionsFromException(
  exception: AvailabilityException
): string[] {
  const availableTimeSlots: string[] = [];

  const defaultMorningStart = "08:00";
  const defaultMorningEnd = "12:00";
  const defaultAfternoonStart = "12:00";
  const defaultAfternoonEnd = "17:00";
  const defaultEveningStart = "17:00";
  const defaultEveningEnd = "22:00";

  if (exception.morning) {
    const startTime = exception.morningStart || defaultMorningStart;
    const endTime = exception.morningEnd || defaultMorningEnd;
    availableTimeSlots.push(...generateTimeSlotsInRange(startTime, endTime));
  }

  if (exception.afternoon) {
    const startTime = exception.afternoonStart || defaultAfternoonStart;
    const endTime = exception.afternoonEnd || defaultAfternoonEnd;
    availableTimeSlots.push(...generateTimeSlotsInRange(startTime, endTime));
  }

  if (exception.evening) {
    const startTime = exception.eveningStart || defaultEveningStart;
    const endTime = exception.eveningEnd || defaultEveningEnd;
    availableTimeSlots.push(...generateTimeSlotsInRange(startTime, endTime));
  }

  return availableTimeSlots;
}

function generateTimeSlotsInRange(
  startTime: string,
  endTime: string
): string[] {
  const slots: string[] = [];

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");

    slots.push(`${formattedHour}:${formattedMinute}`);
  }

  return slots;
}

export function formatDateRange(
  startDate?: Date,
  endDate?: Date,
  locale: string = "nl",
  translations?: { selectDates?: string }
): React.ReactNode {
  const localeMap = {
    nl: nl,
    en: enUS,
    de: de,
  };

  const dateLocale = localeMap[locale] || nl;

  if (startDate && endDate) {
    return (
      <>
        <span className="bg-transparent font-medium text-xs text-black py-0.5 rounded-md">
          {format(startDate, "d MMM yyyy", { locale: dateLocale })}
        </span>{" "}
        -{" "}
        <span className="bg-transparent flex-1 font-medium text-xs text-black py-0.5 rounded-md">
          {format(endDate, "d MMM yyyy", { locale: dateLocale })}
        </span>
      </>
    );
  }
  if (startDate) {
    return format(startDate, "d MMM yyyy", { locale: dateLocale });
  }
  return translations?.selectDates || "Select dates";
}
