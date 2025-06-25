"use client";

import React, { useState, useEffect, useRef } from "react";
import { Slider, Handles, Tracks, Rail } from "react-compound-slider";
import moment from "moment";
import { Info, CircleCheck, CalendarPlus, X, CalendarOff } from "lucide-react";

// --- Shadcn UI imports (assuming these are available in your setup) ---
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─────────────────────────────────────────────────────────────────────────────
// DAY NAMES IN DUTCH
// ─────────────────────────────────────────────────────────────────────────────

const dayNamesInDutch = {
  monday: "Maandag",
  tuesday: "Dinsdag",
  wednesday: "Woensdag",
  thursday: "Donderdag",
  friday: "Vrijdag",
  saturday: "Zaterdag",
  sunday: "Zondag",
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function getTimeNumber(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + (minutes >= 30 ? 0.5 : 0);
}

function getTimeString(timeNum: number) {
  const hours = Math.floor(timeNum);
  const minutes = (timeNum - hours) * 60;
  return `${hours.toString().padStart(2, "0")}:${minutes === 0 ? "00" : "30"}`;
}

function formatTime(time: number) {
  let hours = Math.floor(time);
  let minutes = (time - hours) * 60;

  // Handle day boundaries
  if (hours === 24) hours = 0;
  if (hours === 25) hours = 1;

  return `${hours.toString().padStart(2, "0")}:${minutes === 0 ? "00" : "30"}`;
}

// Generate time blocks for display (5am to 11pm with 2-hour gaps)
const timeBlocks = Array.from({ length: 11 }, (_, i) => (i * 2 + 5) % 24);

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: USEWINDOWWIDTH (SIMPLE)
// ─────────────────────────────────────────────────────────────────────────────

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);

      // Set initial width
      handleResize();

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return width;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDER HANDLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

// function Handle({ handle, getHandleProps }: any) {
//   return (
//     <div
//       style={{ left: `${handle.percent}%` }}
//       className="absolute -translate-y-1/2 top-1/2 z-50 w-5 h-12 rounded-md bg-primary cursor-pointer hover:bg-primary/90"
//       {...getHandleProps(handle.id)}
//     >
//       {/* Visible grip indicator */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full opacity-60"></div>
//     </div>
//   );
// }

// ─────────────────────────────────────────────────────────────────────────────
// TIME SELECT COMPONENT (for mobile view)
// ─────────────────────────────────────────────────────────────────────────────

function TimeSelect({
  period,
  timeBoxNumber,
  addNewTimePeriod,
  handleTimeChange,
}: {
  period: { startTime: string; endTime: string };
  timeBoxNumber: number;
  addNewTimePeriod: () => void;
  handleTimeChange: (n: number, start: number, end: number) => void;
}) {
  const [startTime, setStartTime] = useState(period.startTime);
  const [endTime, setEndTime] = useState(period.endTime);

  useEffect(() => {
    if (startTime && endTime) {
      handleTimeChange(
        timeBoxNumber,
        getTimeNumber(startTime),
        getTimeNumber(endTime)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);

  return (
    <div className="border border-gray-200 p-4 rounded-md mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">
          Tijdslot {timeBoxNumber + 1}
        </span>
        <Button
          variant="link"
          onClick={addNewTimePeriod}
          className="p-0 h-auto text-sm inline-flex gap-1"
        >
          <CalendarPlus size={16} />
          Nieuw tijdslot
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label
            htmlFor={`start-time-${timeBoxNumber}`}
            className="text-xs text-gray-500 mb-1"
          >
            Start tijd
          </Label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer tijd" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 48 }, (_, i) => {
                const hour = Math.floor(i / 2);
                const minute = i % 2 === 0 ? '00' : '30';
                const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
                return (
                  <SelectItem key={timeValue} value={timeValue}>
                    {timeValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label
            htmlFor={`end-time-${timeBoxNumber}`}
            className="text-xs text-gray-500 mb-1"
          >
            Eind tijd
          </Label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer tijd" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 48 }, (_, i) => {
                const hour = Math.floor(i / 2);
                const minute = i % 2 === 0 ? '00' : '30';
                const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
                return (
                  <SelectItem key={timeValue} value={timeValue}>
                    {timeValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY OVERVIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function AvailabilityOverview({
  setShowOverview,
  activeRangesPerDay,
}: {
  setShowOverview: (b: boolean) => void;
  activeRangesPerDay: { [key: string]: number[] };
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  useEffect(() => {
    const scrollHandler = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 0);
      }
    };

    const scrollableElement = scrollRef.current;
    if (scrollableElement) {
      scrollableElement.addEventListener("scroll", scrollHandler);
    }

    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener("scroll", scrollHandler);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={() => setShowOverview(false)}
      />
      <div className="fixed z-50 w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div
          className={`flex items-center justify-between p-4 ${
            isScrolled ? "border-b border-gray-200" : ""
          }`}
        >
          <h3 className="font-semibold text-lg">Weekoverzicht</h3>
          <Button
            variant="ghost"
            onClick={() => setShowOverview(false)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        <div
          className="overflow-y-auto p-6"
          ref={scrollRef}
          style={{ maxHeight: "70vh" }}
        >
          {daysOfWeek?.map((day) => (
            <div key={day} className="mb-6">
              <p className="font-medium text-base mb-2">
                {dayNamesInDutch?.[day]}
              </p>
              <div className="relative h-12 bg-gray-100 rounded-md mb-3">
                {activeRangesPerDay?.[day]?.map((time, i) => {
                  if (i % 2 === 0) {
                    const endTime = activeRangesPerDay[day][i + 1];
                    const left = ((time - 5) / 20) * 100;
                    const width = ((endTime - time) / 20) * 100;
                    return (
                      <div
                        key={i}
                        className="absolute h-full bg-primary rounded-md flex items-center justify-center text-white text-sm transition-all"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <p>{`${formatTime(time)} - ${formatTime(endTime)}`}</p>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* No time slots */}
                {(!activeRangesPerDay?.[day] ||
                  activeRangesPerDay[day].length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    <CalendarOff size={16} className="mr-2" />
                    <span>Niet beschikbaar voor verhuur</span>
                  </div>
                )}
              </div>

              <div className="relative h-6">
                {timeBlocks.map((value, i) => (
                  <div
                    key={i}
                    className="absolute text-xs text-gray-500"
                    style={{ left: `calc(${i * 10}% - 15px)` }}
                  >
                    {value === 24
                      ? "00:00"
                      : `${value.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IS NOT AVAILABLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function IsNotAvailable({
  selectedDays,
  setShowOverview,
}: {
  selectedDays: { short: string; english: string; index: number }[];
  setShowOverview: (b: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
      <CalendarOff size={36} strokeWidth={1.5} className="text-gray-400 mb-4" />
      <p className="text-center text-gray-600 mb-6 max-w-md">
        De aanhanger wordt op de geselecteerde dag(en) niet beschikbaar gesteld
        voor verhuur. Je kunt de beschikbaarheid later aanpassen via het
        kalender overzicht.
      </p>
      <Button variant="outline" onClick={() => setShowOverview(true)}>
        Bekijk weekoverzicht
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IS AVAILABLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function IsAvailable({
  activeRanges,
  setActiveRanges,
  setShowOverview,
  timePeriods,
  setTimePeriods,
  onOptionsChange = () => {},
}: {
  activeRanges: number[];
  setActiveRanges: (ranges: number[]) => void;
  setShowOverview: (b: boolean) => void;
  timePeriods: { startTime: string; endTime: string }[];
  setTimePeriods: (p: { startTime: string; endTime: string }[]) => void;
  onOptionsChange?: (opts: any) => void;
}) {
  const windowWidth = useWindowWidth();
  const [additionalOptions, setAdditionalOptions] = useState({
    contactlessPickup: false,
    pickupInstructions: "",
    instantBooking: true,
    minDuration: {
      enabled: false,
      value: 2,
    },
  });

  // Format selected time periods for display
  useEffect(() => {
    setTimePeriods(formatTimePeriods(activeRanges));
  }, [activeRanges, setTimePeriods]);

  // Pass options changes to parent component
  useEffect(() => {
    onOptionsChange(additionalOptions);
  }, [additionalOptions, onOptionsChange]);

  // Add a new time frame to the slider
  const addNewTimeFrame = () => {
    if (activeRanges.length < 6) {
      if (activeRanges.length === 0) {
        // Default 9am-5pm if no time slots
        setActiveRanges([9, 17]);
      } else if (
        activeRanges.length === 2 &&
        activeRanges[0] === 5 &&
        activeRanges[1] === 25
      ) {
        // Split full day into morning and afternoon
        setActiveRanges([5, 14, 15, 25]);
      } else if (
        activeRanges.length === 4 &&
        activeRanges[0] === 5 &&
        activeRanges[3] === 25
      ) {
        // Split into three periods
        setActiveRanges([5, 11, 12, 18, 19, 25]);
      } else {
        // Add a period at the end
        const lastValue = activeRanges[activeRanges.length - 1];
        const newStartTime = lastValue + 1 > 24 ? 5 : lastValue + 1;
        const newEndTime = newStartTime + 3 > 24 ? 24 : newStartTime + 3;
        setActiveRanges([...activeRanges, newStartTime, newEndTime]);
      }
    }
  };

  // Format time periods from numeric values
  const formatTimePeriods = (ranges: number[]) => {
    if (!ranges?.length) {
      return [{ startTime: "09:00", endTime: "17:00" }];
    }

    const periods = [];
    for (let i = 0; i < ranges?.length; i += 2) {
      if (i + 1 < ranges.length) {
        periods.push({
          startTime: formatTime(ranges[i]),
          endTime: formatTime(ranges[i + 1]),
        });
      }
    }
    return periods;
  };

  // Handle time input changes from mobile view
  const handleTimeChange = (
    timeBoxNumber: number,
    startTime: number,
    endTime: number
  ) => {
    let updatedRanges = [...activeRanges];

    updatedRanges[timeBoxNumber * 2] = startTime;
    updatedRanges[timeBoxNumber * 2 + 1] = endTime;

    // Ensure end time is after start time
    if (
      updatedRanges[timeBoxNumber * 2 + 1] <= updatedRanges[timeBoxNumber * 2]
    ) {
      updatedRanges[timeBoxNumber * 2 + 1] =
        updatedRanges[timeBoxNumber * 2] + 0.5;
    }

    setActiveRanges(updatedRanges);
  };

  // Add new time period (mobile view)
  function addNewTimePeriod() {
    if (timePeriods.length < 3) {
      const lastItem = timePeriods[timePeriods.length - 1];
      const lastEndTime = moment(lastItem.endTime, "HH:mm");
      const newStartTime = lastEndTime.add(30, "minutes").format("HH:mm");
      const newEndTime = lastEndTime.add(90, "minutes").format("HH:mm");

      setTimePeriods([
        ...timePeriods,
        { startTime: newStartTime, endTime: newEndTime },
      ]);

      // Update the active ranges as well
      const newActiveRanges = [...activeRanges];
      newActiveRanges.push(getTimeNumber(newStartTime));
      newActiveRanges.push(getTimeNumber(newEndTime));
      setActiveRanges(newActiveRanges);
    }
  }

  // Initialize with default values
  useEffect(() => {
    if (windowWidth > 0 && activeRanges.length === 0) {
      setActiveRanges([9, 17]); // Default 9am-5pm
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth]);

  return (
    <div className="mt-4">
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-2">
              Tijdsblokken instellen
            </h3>
            <p className="text-sm text-gray-500">
              Geef de gewenste tijdblokken op waarbinnen een aanhanger opgehaald
              en teruggebracht kan worden. Wanneer geen tijdsblokken worden
              ingesteld, wordt die dag als niet verhuurbaar ingesteld.
            </p>
          </div>

          {/* Quick time options */}
          <QuickTimeOptions setActiveRanges={setActiveRanges} />

          {/* Mobile time selection */}
          {windowWidth <= 680 ? (
            <div className="w-full space-y-3">
              {timePeriods?.map((item, index) => (
                <TimeSelect
                  key={index}
                  period={item}
                  timeBoxNumber={index}
                  addNewTimePeriod={addNewTimePeriod}
                  handleTimeChange={handleTimeChange}
                />
              ))}

              {timePeriods.length < 3 && (
                <Button
                  variant="outline"
                  className="w-full mt-2 flex items-center justify-center gap-2"
                  onClick={addNewTimePeriod}
                >
                  <CalendarPlus size={16} />
                  Voeg tijdslot toe
                </Button>
              )}
            </div>
          ) : (
            /* Desktop time selection buttons */
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeRanges.length >= 2 && (
                <div
                  className="flex items-center px-3 py-1 bg-orange-50 border border-primary text-sm rounded-full cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => {
                    if (activeRanges.length === 2) {
                      // Don't remove the last time slot
                      return;
                    }
                    const newActiveRanges = activeRanges.slice(2);
                    setActiveRanges(newActiveRanges);
                  }}
                >
                  {`${formatTime(activeRanges[0])} - ${formatTime(
                    activeRanges[1]
                  )}`}
                  {activeRanges.length > 2 && (
                    <>
                      <div className="mx-2 w-px h-4 bg-orange-200" />
                      <X size={14} className="text-primary" />
                    </>
                  )}
                </div>
              )}

              {activeRanges.length >= 4 && (
                <div
                  className="flex items-center px-3 py-1 bg-orange-50 border border-orange-200 rounded-full cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => {
                    const newActiveRanges = [
                      ...activeRanges.slice(0, 2),
                      ...activeRanges.slice(4),
                    ];
                    setActiveRanges(newActiveRanges);
                  }}
                >
                  {`${formatTime(activeRanges[2])} - ${formatTime(
                    activeRanges[3]
                  )}`}
                  <div className="mx-2 w-px h-4 bg-orange-200" />
                  <X size={14} className="text-primary" />
                </div>
              )}

              {activeRanges.length >= 6 && (
                <div
                  className="flex items-center px-3 py-1 bg-orange-50 border border-orange-200 rounded-full cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => {
                    const newActiveRanges = activeRanges.slice(0, 4);
                    setActiveRanges(newActiveRanges);
                  }}
                >
                  {`${formatTime(activeRanges[4])} - ${formatTime(
                    activeRanges[5]
                  )}`}
                  <div className="mx-2 w-px h-4 bg-orange-200" />
                  <X size={14} className="text-primary" />
                </div>
              )}

              <div className="ml-auto flex items-center space-x-3">
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => setShowOverview(true)}
                >
                  Bekijk weekoverzicht
                </Button>

                {activeRanges.length < 6 && (
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90 text-sm"
                    onClick={addNewTimeFrame}
                  >
                    Nieuw tijdsblok
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time slider (desktop only) */}
        {windowWidth > 680 && (
          <div className="mt-8 pb-6">
            {/* Use 'overflow-visible' if the handle extends beyond the rail. */}
            <div className="relative pb-8 overflow-visible">
              <Slider
                rootStyle={{ position: "relative", width: "100%" }}
                domain={[5, 25]}
                step={0.5}
                mode={2}
                values={activeRanges}
                onUpdate={setActiveRanges}
                onChange={setActiveRanges}
              >
                {/* Gray rail (behind everything) */}
                <Rail>
                  {({ getRailProps }) => (
                    <div
                      {...getRailProps()}
                      className="z-0 relative bg-gray-200 rounded-md h-[60px] overflow-visible"
                    />
                  )}
                </Rail>

                {/* Handles, always on top */}
                <Handles>
                  {({ handles, getHandleProps }) => (
                    <div className="relative">
                      {handles.map((handle: any) => (
                        <div
                          key={handle.id}
                          // 1) Position handle at left: handle.percent%
                          // 2) Center it with translate(-50%, -50%)
                          style={{
                            left: `${handle.percent}%`,
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                          className="absolute z-50 w-5 h-12 bg-primary cursor-pointer
                             rounded-sm hover:bg-primary/90"
                          {...getHandleProps(handle.id)}
                        >
                          {/* Grip indicator */}
                          <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                               w-1 h-6 bg-white rounded opacity-60"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Handles>

                {/* Orange track in front of the rail but below the handles */}
                <Tracks left={false} right={false}>
                  {({ tracks, getTrackProps }) => (
                    <div className="relative">
                      {tracks.map(({ id, source, target }, index) => (
                        <div
                          key={id}
                          {...getTrackProps()}
                          className={`absolute ${
                            // For clarity, only color every other track segment
                            index % 2 === 0
                              ? "bg-primary/50 border border-primary"
                              : "bg-transparent"
                          } transition-all z-10 rounded-sm`}
                          style={{
                            top: "0",
                            left: `${source.percent}%`,
                            width: `${target.percent - source.percent}%`,
                            height: "60px",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </Tracks>
              </Slider>

              {/* Time markers below the slider */}
              <div className="flex justify-between absolute bottom-0 left-0 right-0 px-2">
                {[
                  "05:00",
                  "07:00",
                  "09:00",
                  "11:00",
                  "13:00",
                  "15:00",
                  "17:00",
                  "19:00",
                  "21:00",
                  "23:00",
                  "01:00",
                ].map((time, i) => (
                  <div key={i} className="text-xs text-gray-500">
                    {time}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Rental Options */}
        <AdditionalOptions
          options={additionalOptions}
          setOptions={setAdditionalOptions}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK TIME OPTIONS COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function QuickTimeOptions({
  setActiveRanges,
}: {
  setActiveRanges: (v: number[]) => void;
}) {
  const timeOptions = [
    { label: "Hele dag", value: [5, 25], icon: "sun" },
    { label: "Ochtend", value: [8, 12], icon: "sunrise" },
    { label: "Middag", value: [12, 17], icon: "sun" },
    { label: "Avond", value: [17, 22], icon: "sunset" },
  ];

  return (
    <div className="mb-5">
      <p className="text-sm text-gray-600 mb-2">Snelle selectie:</p>
      <div className="flex flex-wrap gap-2">
        {timeOptions.map((option) => (
          <Button
            key={option.label}
            variant="outline"
            className="px-3 py-1.5 text-sm"
            onClick={() => setActiveRanges(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL OPTIONS COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function AdditionalOptions({
  options,
  setOptions,
}: {
  options: any;
  setOptions: (opts: any) => void;
}) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-5">
      <h3 className="font-semibold text-base mb-3">Aanvullende opties</h3>

      <div className="space-y-3">
        {/* Contactless pickup option */}
        <div className="flex items-start">
          <Checkbox
            id="contactless-pickup"
            checked={options.contactlessPickup}
            onCheckedChange={() =>
              setOptions({
                ...options,
                contactlessPickup: !options.contactlessPickup,
              })
            }
            className="mt-1"
          />
          <div className="ml-2 text-sm">
            <Label
              htmlFor="contactless-pickup"
              className="font-medium text-gray-700"
            >
              Contactloze ophaling
            </Label>
            <p className="text-gray-500">
              Huurders kunnen de aanhanger ophalen zonder persoonlijk contact,
              bijvoorbeeld via een codeslot of sleutelkluis.
            </p>

            {options.contactlessPickup && (
              <div className="mt-2">
                <Label
                  htmlFor="pickup-instructions"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Instructies voor ophalen
                </Label>
                <Textarea
                  id="pickup-instructions"
                  rows={2}
                  value={options.pickupInstructions}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      pickupInstructions: e.target.value,
                    })
                  }
                  placeholder="Bijv: De code van het cijferslot is 1234. De aanhanger staat op de oprit links."
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Instant booking option */}
        <div className="flex items-start">
          <Checkbox
            id="instant-booking"
            checked={options.instantBooking}
            onCheckedChange={() =>
              setOptions({
                ...options,
                instantBooking: !options.instantBooking,
              })
            }
            className="mt-1"
          />
          <div className="ml-2 text-sm">
            <Label
              htmlFor="instant-booking"
              className="font-medium text-gray-700"
            >
              Direct boekbaar
            </Label>
            <p className="text-gray-500">
              Huurders kunnen zonder goedkeuring vooraf reserveren. Indien
              uitgeschakeld moeten aanvragen eerst door jou worden goedgekeurd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AVAILABILITY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Availability({
  trailerWeekScheduleTemplate = {},
  setTrailerWeekScheduleTemplate = () => {},
  availability = {},
  setAvailability = () => {},
  activeRangesPerDay = {},
  setActiveRangesPerDay = () => {},
  activeRanges = [],
  setActiveRanges = () => {},
  defaultRanges = [9, 17],
}: {
  trailerWeekScheduleTemplate?: any;
  setTrailerWeekScheduleTemplate?: (v: any) => void;
  availability?: { [key: string]: boolean };
  setAvailability?: (v: any) => void;
  activeRangesPerDay?: { [key: string]: number[] };
  setActiveRangesPerDay?: (v: any) => void;
  activeRanges?: number[];
  setActiveRanges?: (ranges: number[]) => void;
  defaultRanges?: number[];
}) {
  const [showOverview, setShowOverview] = useState(false);
  const [multiSelectActive, setMultiSelectActive] = useState(false);
  const [timePeriods, setTimePeriods] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [mounted, setMounted] = useState(false);
  const windowWidth = useWindowWidth();

  // Day mapping for UI
  const dayNamesMapping: {
    [key: string]: { short: string; english: string; index: number };
  } = {
    ma: { short: "ma", english: "monday", index: 0 },
    di: { short: "di", english: "tuesday", index: 1 },
    woe: { short: "woe", english: "wednesday", index: 2 },
    do: { short: "do", english: "thursday", index: 3 },
    vri: { short: "vri", english: "friday", index: 4 },
    za: { short: "za", english: "saturday", index: 5 },
    zo: { short: "zo", english: "sunday", index: 6 },
  };

  const [selectedDays, setSelectedDays] = useState([dayNamesMapping["ma"]]);

  const daysOfWeek = Object.values(dayNamesMapping);

  // Handle day selection
  const handleSelectedDays = (item: {
    short: string;
    english: string;
    index: number;
  }) => {
    setSelectedDays((currentDays) => {
      if (multiSelectActive) {
        const isSelected = currentDays.find((day) => day.short === item.short);
        return isSelected
          ? currentDays.filter((day) => day.short !== item.short)
          : [...currentDays, item].sort((a, b) => a.index - b.index);
      } else {
        return [item];
      }
    });

    // Initialize availability for the selected day if it doesn't exist
    if (!availability[item.english]) {
      setAvailability((prev) => ({
        ...prev,
        [item.english]: false,
      }));
    }

    // Set active ranges for the selected day
    const activeRangesForDay =
      activeRangesPerDay?.[item.english] || defaultRanges;
    setActiveRanges(activeRangesForDay);
  };

  const toggleAvailability = (isAvailable: boolean) => {
    const updatedAvailability: { [key: string]: boolean } = { ...availability };

    selectedDays.forEach((day) => {
      updatedAvailability[day.english] = isAvailable;

      // Initialize time slots if making available
      if (isAvailable && !activeRangesPerDay[day.english]) {
        setActiveRangesPerDay((prev: any) => ({
          ...prev,
          [day.english]: defaultRanges,
        }));
      }
    });

    setAvailability(updatedAvailability);
  };

  // Update active ranges for selected days
  useEffect(() => {
    if (setActiveRangesPerDay && selectedDays.length > 0) {
      setActiveRangesPerDay((currentRanges: any) => {
        const updatedRanges = { ...currentRanges };

        selectedDays.forEach((day) => {
          updatedRanges[day.english] = activeRanges;
        });

        return updatedRanges;
      });
    }
  }, [activeRanges, selectedDays, setActiveRangesPerDay]);

  // Update trailer schedule template
  useEffect(() => {
    if (setTrailerWeekScheduleTemplate && selectedDays.length > 0) {
      setTrailerWeekScheduleTemplate((currentSchedule: any) => {
        const updatedSchedule = { ...currentSchedule };

        selectedDays.forEach((day) => {
          if (!updatedSchedule[day.english]) {
            updatedSchedule[day.english] = { timeSlots: [] };
          }

          updatedSchedule[day.english].timeSlots = [];

          // Convert time ranges to time slots
          for (let i = 0; i < activeRanges?.length; i += 2) {
            if (i + 1 < activeRanges.length) {
              let startHour = Math.floor(activeRanges[i]);
              let startMinutes = (activeRanges[i] % 1) * 60;
              let endHour = Math.floor(activeRanges[i + 1]);
              let endMinutes = (activeRanges[i + 1] % 1) * 60;

              // Format times
              const startTime =
                (startHour === 24
                  ? "00"
                  : startHour < 10
                  ? `0${startHour}`
                  : `${startHour}`) +
                ":" +
                (startMinutes === 30 ? "30" : "00") +
                ":00";

              const endTime =
                (endHour === 24
                  ? "00"
                  : endHour === 25
                  ? "01"
                  : endHour < 10
                  ? `0${endHour}`
                  : `${endHour}`) +
                ":" +
                (endMinutes === 30 ? "30" : "00") +
                ":00";

              updatedSchedule[day.english].timeSlots.push({
                startTime,
                endTime,
              });
            }
          }
        });

        return updatedSchedule;
      });
    }
  }, [activeRanges, selectedDays, setTrailerWeekScheduleTemplate]);

  // Toggle multi-select mode
  const handleMultiSelectClick = () => {
    if (!multiSelectActive) {
      setMultiSelectActive(true);
    } else {
      // Reset to single day selection when toggling off
      const firstDay =
        selectedDays.length > 0 ? selectedDays[0] : daysOfWeek[0];
      setSelectedDays([firstDay]);
      setMultiSelectActive(false);
    }
  };

  // Initialize component
  useEffect(() => {
    setMounted(true);

    // Initialize active ranges if empty
    if (activeRanges.length === 0) {
      setActiveRanges(defaultRanges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div className="mx-auto pb-32 pt-52">
      <h2 className="text-2xl font-semibold mb-3 text-gray-800">
        Beschikbaarheid
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Geef de algemene beschikbaarheid van de aanhanger per dag op. Afwijkende
        beschikbaarheid kan later via je account worden aangepast.
      </p>

      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Selecteer dagen</h3>
          <Button
            variant={multiSelectActive ? "default" : "ghost"}
            className={`rounded-full p-2 ${
              multiSelectActive ? "bg-orange-100 text-primary" : ""
            }`}
            onClick={handleMultiSelectClick}
            title={
              multiSelectActive
                ? "Schakel meerdere selectie uit"
                : "Selecteer meerdere dagen tegelijk"
            }
          >
            <CalendarPlus size={18} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-5">
          {daysOfWeek?.map((item, index) => {
            const dayTimeSlots =
              trailerWeekScheduleTemplate?.[item.english]?.timeSlots || [];
            const isAvailable = dayTimeSlots.length > 0;
            const isSelected = selectedDays.some(
              (day) => day.short === item.short
            );

            return (
              <div
                key={index}
                onClick={() => handleSelectedDays(item)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-lg
                  cursor-pointer transition-all h-24
                  ${
                    isSelected
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }
                  ${
                    isAvailable && !isSelected
                      ? "border-2 border-green-400"
                      : ""
                  }
                `}
              >
                <span className="font-medium mb-2">{item.short}</span>

                {isAvailable ? (
                  <CircleCheck
                    size={18}
                    className={`mt-2 ${
                      isSelected ? "text-white" : "text-green-500"
                    }`}
                  />
                ) : (
                  <div className="mt-2 w-4 h-0.5 bg-gray-300 rounded"></div>
                )}

                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-white rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Availability Toggle for Selected Days */}
        {selectedDays.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-gray-800">Beschikbaarheid</h4>
                <p className="text-sm text-gray-600 ">
                  {selectedDays.length > 1
                    ? `${selectedDays.length} dagen geselecteerd`
                    : `${dayNamesInDutch?.[selectedDays[0].english]}`}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant={
                    availability?.[selectedDays[0].english]
                      ? "default"
                      : "outline"
                  }
                  className={
                    availability?.[selectedDays[0].english]
                      ? "bg-primary hover:bg-primary/90"
                      : ""
                  }
                  onClick={() => toggleAvailability(true)}
                >
                  Beschikbaar
                </Button>
                <Button
                  variant={
                    !availability?.[selectedDays[0].english]
                      ? "default"
                      : "outline"
                  }
                  className={
                    !availability?.[selectedDays[0].english]
                      ? "bg-primary hover:bg-primary/90"
                      : ""
                  }
                  onClick={() => toggleAvailability(false)}
                >
                  Niet beschikbaar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Conditional render: IsAvailable vs IsNotAvailable */}
        {selectedDays.length > 0 && (
          <>
            {availability?.[selectedDays[0].english] ? (
              <IsAvailable
                activeRanges={activeRanges}
                setActiveRanges={setActiveRanges}
                setShowOverview={setShowOverview}
                timePeriods={timePeriods}
                setTimePeriods={setTimePeriods}
              />
            ) : (
              <IsNotAvailable
                selectedDays={selectedDays}
                setShowOverview={setShowOverview}
              />
            )}
          </>
        )}
      </div>

      {/* Availability Overview Modal */}
      {showOverview && (
        <AvailabilityOverview
          setShowOverview={setShowOverview}
          activeRangesPerDay={activeRangesPerDay}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export { getTimeNumber, getTimeString };
