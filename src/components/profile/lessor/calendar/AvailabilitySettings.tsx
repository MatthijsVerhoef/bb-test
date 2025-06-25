"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Calendar,
  Check,
  X,
  AlertCircle,
  Save,
  Info,
} from "lucide-react";
import { useLessorCalendarData } from "@/hooks/useLessorCalendarData";
import { enhancedFetch } from "@/lib/enhanced-fetch";

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  available: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilitySettingsProps {
  userId: string;
  trailers: any[];
  weeklyAvailabilityData: any[];
}

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "Ma", fullName: "Maandag" },
  { key: "TUESDAY", label: "Di", fullName: "Dinsdag" },
  { key: "WEDNESDAY", label: "Wo", fullName: "Woensdag" },
  { key: "THURSDAY", label: "Do", fullName: "Donderdag" },
  { key: "FRIDAY", label: "Vr", fullName: "Vrijdag" },
  { key: "SATURDAY", label: "Za", fullName: "Zaterdag" },
  { key: "SUNDAY", label: "Zo", fullName: "Zondag" },
];

export default function AvailabilitySettings({
  userId,
  trailers,
  weeklyAvailabilityData,
}: AvailabilitySettingsProps) {
  const [selectedScope, setSelectedScope] = useState<"all" | string>("all");
  const [availability, setAvailability] = useState<
    Record<string, DayAvailability>
  >({});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingTimeSlots, setEditingTimeSlots] = useState<TimeSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize availability based on scope
  useEffect(() => {
    initializeAvailability();
  }, [selectedScope, weeklyAvailabilityData]);

  const initializeAvailability = () => {
    const newAvailability: Record<string, DayAvailability> = {};

    if (selectedScope === "all") {
      // Initialize with default settings for all trailers
      DAYS_OF_WEEK.forEach((day) => {
        // Check if any trailer has this day available
        const anyAvailable = weeklyAvailabilityData.some(
          (wa) => wa.day === day.key && wa.available
        );

        newAvailability[day.key] = {
          available: anyAvailable,
          timeSlots: [{ start: "09:00", end: "17:00" }],
        };
      });
    } else {
      // Load specific trailer availability
      const trailerAvailability = weeklyAvailabilityData.filter(
        (wa) => wa.trailerId === selectedScope
      );

      DAYS_OF_WEEK.forEach((day) => {
        const dayData = trailerAvailability.find((wa) => wa.day === day.key);

        if (dayData) {
          const timeSlots: TimeSlot[] = [];

          // Convert from the stored format to our time slots
          if (dayData.timeSlot1Start && dayData.timeSlot1End) {
            timeSlots.push({
              start: dayData.timeSlot1Start,
              end: dayData.timeSlot1End,
            });
          }
          if (dayData.timeSlot2Start && dayData.timeSlot2End) {
            timeSlots.push({
              start: dayData.timeSlot2Start,
              end: dayData.timeSlot2End,
            });
          }
          if (dayData.timeSlot3Start && dayData.timeSlot3End) {
            timeSlots.push({
              start: dayData.timeSlot3Start,
              end: dayData.timeSlot3End,
            });
          }

          newAvailability[day.key] = {
            available: dayData.available,
            timeSlots:
              timeSlots.length > 0
                ? timeSlots
                : [{ start: "09:00", end: "17:00" }],
          };
        } else {
          // Default if no data exists
          newAvailability[day.key] = {
            available: true,
            timeSlots: [{ start: "09:00", end: "17:00" }],
          };
        }
      });
    }

    setAvailability(newAvailability);
    setHasChanges(false);
  };

  const toggleDay = (dayKey: string) => {
    setAvailability((prev) => {
      const wasAvailable = prev[dayKey]?.available || false;
      const newAvailable = !wasAvailable;

      // Show warning if disabling a day
      if (wasAvailable && !newAvailable) {
        setShowWarning(true);
      }

      return {
        ...prev,
        [dayKey]: {
          available: newAvailable,
          timeSlots: newAvailable
            ? prev[dayKey]?.timeSlots?.length > 0
              ? prev[dayKey].timeSlots
              : [{ start: "09:00", end: "17:00" }]
            : [],
        },
      };
    });
    setHasChanges(true);
  };

  const startEditingTimeSlots = (dayKey: string) => {
    setEditingDay(dayKey);
    setEditingTimeSlots([...availability[dayKey].timeSlots]);
  };

  const saveTimeSlots = () => {
    if (editingDay) {
      setAvailability((prev) => ({
        ...prev,
        [editingDay]: {
          ...prev[editingDay],
          timeSlots: [...editingTimeSlots],
        },
      }));
      setHasChanges(true);
    }
    setEditingDay(null);
    setEditingTimeSlots([]);
  };

  const cancelEditing = () => {
    setEditingDay(null);
    setEditingTimeSlots([]);
  };

  const addTimeSlot = () => {
    if (editingTimeSlots.length < 3) {
      setEditingTimeSlots([
        ...editingTimeSlots,
        { start: "12:00", end: "17:00" },
      ]);
    }
  };

  const removeTimeSlot = (index: number) => {
    if (editingTimeSlots.length > 1) {
      setEditingTimeSlots(editingTimeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updatedSlots = [...editingTimeSlots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value,
    };
    setEditingTimeSlots(updatedSlots);
  };

  const applyTimePreset = (preset: string) => {
    if (!editingDay) return;

    let newTimeSlots: TimeSlot[] = [];

    switch (preset) {
      case "workDay":
        newTimeSlots = [{ start: "09:00", end: "17:00" }];
        break;
      case "allDay":
        newTimeSlots = [{ start: "08:00", end: "20:00" }];
        break;
      case "morning":
        newTimeSlots = [{ start: "08:00", end: "12:00" }];
        break;
      case "afternoon":
        newTimeSlots = [{ start: "12:00", end: "17:00" }];
        break;
      case "evening":
        newTimeSlots = [{ start: "17:00", end: "22:00" }];
        break;
      default:
        return;
    }

    setEditingTimeSlots(newTimeSlots);
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Convert availability to API format
      const weeklyAvailabilityUpdates = Object.entries(availability).map(
        ([day, data]) => ({
          day,
          available: data.available,
          timeSlot1Start: (data.available && data.timeSlots[0]?.start) || null,
          timeSlot1End: (data.available && data.timeSlots[0]?.end) || null,
          timeSlot2Start: (data.available && data.timeSlots[1]?.start) || null,
          timeSlot2End: (data.available && data.timeSlots[1]?.end) || null,
          timeSlot3Start: (data.available && data.timeSlots[2]?.start) || null,
          timeSlot3End: (data.available && data.timeSlots[2]?.end) || null,
        })
      );

      const endpoint = "/api/user/profile/lessor-calendar/availability";
      const body = {
        scope: selectedScope,
        trailerIds:
          selectedScope === "all" ? trailers.map((t) => t.id) : [selectedScope],
        weeklyAvailability: weeklyAvailabilityUpdates,
      };

      const result = await enhancedFetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh the calendar data
      window.location.reload();
    } catch (error: any) {
      console.error("Error saving availability:", error);
      setSaveError(
        error.message || "Er is een fout opgetreden bij het opslaan"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const quickActions = [
    {
      label: "Elke dag",
      action: () => {
        const newAvailability = { ...availability };
        DAYS_OF_WEEK.forEach((day) => {
          newAvailability[day.key] = {
            ...newAvailability[day.key],
            available: true,
          };
        });
        setAvailability(newAvailability);
        setHasChanges(true);
      },
    },
    {
      label: "Doordeweeks",
      action: () => {
        const newAvailability = { ...availability };
        ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].forEach(
          (day) => {
            newAvailability[day] = {
              ...newAvailability[day],
              available: true,
            };
          }
        );
        setAvailability(newAvailability);
        setHasChanges(true);
      },
    },
    {
      label: "Weekend",
      action: () => {
        const newAvailability = { ...availability };
        ["SATURDAY", "SUNDAY"].forEach((day) => {
          newAvailability[day] = {
            ...newAvailability[day],
            available: true,
          };
        });
        setAvailability(newAvailability);
        setHasChanges(true);
      },
    },
    {
      label: "Alles wissen",
      action: () => {
        const newAvailability = { ...availability };
        DAYS_OF_WEEK.forEach((day) => {
          newAvailability[day.key] = {
            ...newAvailability[day.key],
            available: false,
          };
        });
        setAvailability(newAvailability);
        setHasChanges(true);
        setShowWarning(true);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Scope Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700 block">
          Toepassen op:
        </label>
        <Select value={selectedScope} onValueChange={setSelectedScope}>
          <SelectTrigger className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all">
            <SelectValue placeholder="Selecteer bereik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle aanhangers</SelectItem>
            {trailers.map((trailer) => (
              <SelectItem key={trailer.id} value={trailer.id}>
                {trailer.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <p className="text-gray-600">
        Stel hier je standaard beschikbaarheid in. Huurders kunnen alleen boeken
        op de dagen en tijden die je hier instelt.
      </p>

      {/* Warning Alert */}
      {showWarning && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Let op:</strong> Als je dagen onbeschikbaar maakt waarop al
            reserveringen zijn, blijven deze reserveringen bestaan. Je moet
            eventuele reserveringen handmatig annuleren.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Error */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Snelle instellingen
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                action.action();
              }}
              className="p-4 text-center border border-gray-200 rounded-xl hover:border-black transition-all duration-200 group"
            >
              <div className="text-sm font-medium text-gray-900 mb-1">
                {action.label}
              </div>
              <div className="text-xs text-gray-500 group-hover:text-gray-600">
                {index === 0 && "Ma t/m Zo"}
                {index === 1 && "Ma t/m Vr"}
                {index === 2 && "Za & Zo"}
                {index === 3 && "Reset alles"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Days Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Beschikbaarheid per dag
        </h3>
        <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-2">
          {DAYS_OF_WEEK.map((day) => {
            const dayData = availability[day.key];
            const isSelected = dayData?.available || false;
            const timeSlots = dayData?.timeSlots || [];

            return (
              <div
                key={day.key}
                className={`
                  relative p-4 border rounded-xl transition-all duration-200
                  ${
                    isSelected
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }
                `}
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDay(day.key);
                      }}
                      className={`
                        relative w-6 h-6 rounded-full border transition-all duration-200
                        ${
                          isSelected
                            ? "border-gray-900 bg-gray-900"
                            : "border-gray-300 hover:border-gray-400"
                        }
                      `}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          className="absolute inset-0 m-auto text-white"
                        />
                      )}
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      {day.fullName}
                    </span>
                  </div>

                  {isSelected && (
                    <Dialog
                      open={editingDay === day.key}
                      onOpenChange={(open) => {
                        if (open) {
                          startEditingTimeSlots(day.key);
                        } else {
                          cancelEditing();
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => startEditingTimeSlots(day.key)}
                        className="px-3 py-1.5 text-[13px] font-medium border-gray-300 rounded-lg bg-[#222222] hover:bg-black/80 text-white transition-colors"
                      >
                        Wijzig tijden
                      </button>
                    </Dialog>
                  )}
                </div>

                {/* Time slots display */}
                {isSelected && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
                        >
                          <Clock size={14} className="mr-1.5 text-gray-400" />
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Geen tijden ingesteld
                      </p>
                    )}
                  </div>
                )}

                {!isSelected && (
                  <p className="text-gray-400 text-sm">
                    Niet beschikbaar op deze dag
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="">
        <button
          type="button"
          onClick={saveAvailability}
          disabled={isSaving || !hasChanges}
          className={`w-full text-sm py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
            hasChanges && !isSaving
              ? "bg-primary text-white hover:bg-primary/80"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <>
              <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Opslaan...
            </>
          ) : (
            "Wijzigingen opslaan"
          )}
        </button>

        {!hasChanges && (
          <p className="text-center text-sm text-gray-500 mt-3">
            Geen wijzigingen om op te slaan
          </p>
        )}
      </div>

      {/* Time Editor Dialog */}
      <Dialog
        open={editingDay !== null}
        onOpenChange={(open) => {
          if (!open) cancelEditing();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Tijden wijzigen voor{" "}
              {DAYS_OF_WEEK.find((d) => d.key === editingDay)?.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Snelle selectie
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    key: "workDay",
                    label: "Werkdag",
                    desc: "9:00 - 17:00",
                  },
                  {
                    key: "allDay",
                    label: "Hele dag",
                    desc: "8:00 - 20:00",
                  },
                  {
                    key: "morning",
                    label: "Ochtend",
                    desc: "8:00 - 12:00",
                  },
                  {
                    key: "afternoon",
                    label: "Middag",
                    desc: "12:00 - 17:00",
                  },
                  {
                    key: "evening",
                    label: "Avond",
                    desc: "17:00 - 22:00",
                  },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      applyTimePreset(preset.key);
                    }}
                    className="p-3 text-left border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {preset.label}
                    </div>
                    <div className="text-xs text-gray-500">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">
                Aangepaste tijden
              </h4>
              <div className="space-y-3">
                {editingTimeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-2">
                          Starttijd
                        </label>
                        <Select
                          value={slot.start}
                          onValueChange={(value) =>
                            updateTimeSlot(index, "start", value)
                          }
                        >
                          <SelectTrigger className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all">
                            <SelectValue placeholder="Selecteer tijd" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 48 }, (_, i) => {
                              const hour = Math.floor(i / 2);
                              const minute = i % 2 === 0 ? "00" : "30";
                              const timeValue = `${hour
                                .toString()
                                .padStart(2, "0")}:${minute}`;
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
                        <label className="text-xs font-medium text-gray-700 block mb-2">
                          Eindtijd
                        </label>
                        <Select
                          value={slot.end}
                          onValueChange={(value) =>
                            updateTimeSlot(index, "end", value)
                          }
                        >
                          <SelectTrigger className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all">
                            <SelectValue placeholder="Selecteer tijd" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 48 }, (_, i) => {
                              const hour = Math.floor(i / 2);
                              const minute = i % 2 === 0 ? "00" : "30";
                              const timeValue = `${hour
                                .toString()
                                .padStart(2, "0")}:${minute}`;
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

                    {editingTimeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeTimeSlot(index);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mt-6"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {editingTimeSlots.length < 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      addTimeSlot();
                    }}
                    className="w-full p-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-sm font-medium transition-all"
                  >
                    + Tijdslot toevoegen
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                cancelEditing();
              }}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                saveTimeSlots();
              }}
              className="px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Tijden opslaan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
