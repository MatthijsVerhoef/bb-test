"use client";

import { useState, useEffect } from "react";
import { Calendar, Check, X, Clock, Info } from "lucide-react";
import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData } from "../types";
import { useTranslation } from "@/lib/i18n/client";
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
  DialogTrigger,
} from "@/components/ui/dialog";

const getDaysOfWeek = (t: any) => [
  {
    key: "MONDAY",
    label: t("sections.availability.dayLabels.monday"),
    fullName: t("sections.availability.dayNames.monday"),
  },
  {
    key: "TUESDAY",
    label: t("sections.availability.dayLabels.tuesday"),
    fullName: t("sections.availability.dayNames.tuesday"),
  },
  {
    key: "WEDNESDAY",
    label: t("sections.availability.dayLabels.wednesday"),
    fullName: t("sections.availability.dayNames.wednesday"),
  },
  {
    key: "THURSDAY",
    label: t("sections.availability.dayLabels.thursday"),
    fullName: t("sections.availability.dayNames.thursday"),
  },
  {
    key: "FRIDAY",
    label: t("sections.availability.dayLabels.friday"),
    fullName: t("sections.availability.dayNames.friday"),
  },
  {
    key: "SATURDAY",
    label: t("sections.availability.dayLabels.saturday"),
    fullName: t("sections.availability.dayNames.saturday"),
  },
  {
    key: "SUNDAY",
    label: t("sections.availability.dayLabels.sunday"),
    fullName: t("sections.availability.dayNames.sunday"),
  },
];

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  available: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilitySectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  updateNestedFormData: <T>(
    parent: keyof TrailerFormData,
    key: string,
    value: T
  ) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
}

// Mock data for time slots - removed since we only need 1 default slot

export const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  updateNestedFormData,
  setCompletedSections,
  setExpandedSections,
}) => {
  const { t } = useTranslation("addTrailer");
  const daysOfWeek = getDaysOfWeek(t);

  // Store availability data for each day
  const [availability, setAvailability] = useState<
    Record<string, DayAvailability>
  >({});

  // Currently editing day
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingTimeSlots, setEditingTimeSlots] = useState<TimeSlot[]>([]);

  // Initialize with mock data
  useEffect(() => {
    if (isExpanded && Object.keys(availability).length === 0) {
      // Initialize all days as available with just 1 time slot
      const initialAvailability: Record<string, DayAvailability> = {};
      daysOfWeek.forEach((day) => {
        initialAvailability[day.key] = {
          available: true,
          timeSlots: [{ start: "09:00", end: "17:00" }], // Just 1 default time slot
        };
      });
      setAvailability(initialAvailability);
    }
  }, [isExpanded]);

  // Get summary text for the collapsed view
  const getSummary = () => {
    const availableDays = Object.entries(availability).filter(
      ([_, data]) => data.available
    ).length;

    if (availableDays === 0) return undefined;
    if (availableDays === 7)
      return t("sections.availability.everyDayAvailable");

    return `${availableDays} ${t("sections.availability.daysAvailable")}`;
  };

  const toggleDay = (dayKey: string) => {
    setAvailability((prev) => {
      const wasAvailable = prev[dayKey]?.available || false;
      const newAvailable = !wasAvailable;

      return {
        ...prev,
        [dayKey]: {
          available: newAvailable,
          // If disabling the day, clear the time slots
          // If enabling the day, keep existing time slots or set default
          timeSlots: newAvailable
            ? prev[dayKey]?.timeSlots?.length > 0
              ? prev[dayKey].timeSlots
              : [{ start: "09:00", end: "17:00" }]
            : [],
        },
      };
    });
  };

  // Start editing time slots for a day
  const startEditingTimeSlots = (dayKey: string) => {
    setEditingDay(dayKey);
    setEditingTimeSlots([...availability[dayKey].timeSlots]);
  };

  // Save edited time slots
  const saveTimeSlots = () => {
    if (editingDay) {
      setAvailability((prev) => ({
        ...prev,
        [editingDay]: {
          ...prev[editingDay],
          timeSlots: [...editingTimeSlots],
        },
      }));
    }
    setEditingDay(null);
    setEditingTimeSlots([]);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDay(null);
    setEditingTimeSlots([]);
  };

  // Add a new time slot
  const addTimeSlot = () => {
    if (editingTimeSlots.length < 3) {
      setEditingTimeSlots([
        ...editingTimeSlots,
        { start: "12:00", end: "17:00" },
      ]);
    }
  };

  // Remove a time slot
  const removeTimeSlot = (index: number) => {
    if (editingTimeSlots.length > 1) {
      setEditingTimeSlots(editingTimeSlots.filter((_, i) => i !== index));
    }
  };

  // Update a specific time slot
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

  // Quick actions
  const quickActions = [
    {
      label: t("sections.availability.quickActions.everyday"),
      action: () => {
        const newAvailability = { ...availability };
        daysOfWeek.forEach((day) => {
          newAvailability[day.key] = {
            ...newAvailability[day.key],
            available: true,
          };
        });
        setAvailability(newAvailability);
      },
    },
    {
      label: t("sections.availability.quickActions.weekdays"),
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
      },
    },
    {
      label: t("sections.availability.quickActions.weekend"),
      action: () => {
        const newAvailability = { ...availability };
        ["SATURDAY", "SUNDAY"].forEach((day) => {
          newAvailability[day] = {
            ...newAvailability[day],
            available: true,
          };
        });
        setAvailability(newAvailability);
      },
    },
    {
      label: t("sections.availability.quickActions.clearAll"),
      action: () => {
        const newAvailability = { ...availability };
        daysOfWeek.forEach((day) => {
          newAvailability[day.key] = {
            ...newAvailability[day.key],
            available: false,
          };
        });
        setAvailability(newAvailability);
      },
    },
  ];

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

  // Save to form
  const saveToForm = () => {
    // Convert to the format expected by the form
    const weeklyAvailability = Object.entries(availability).map(
      ([day, data]) => ({
        day,
        available: data.available,
        // Only include time slots if the day is available
        timeSlot1Start:
          data.available && data.timeSlots[0]?.start
            ? data.timeSlots[0].start
            : null,
        timeSlot1End:
          data.available && data.timeSlots[0]?.end
            ? data.timeSlots[0].end
            : null,
        timeSlot2Start:
          data.available && data.timeSlots[1]?.start
            ? data.timeSlots[1].start
            : null,
        timeSlot2End:
          data.available && data.timeSlots[1]?.end
            ? data.timeSlots[1].end
            : null,
        timeSlot3Start:
          data.available && data.timeSlots[2]?.start
            ? data.timeSlots[2].start
            : null,
        timeSlot3End:
          data.available && data.timeSlots[2]?.end
            ? data.timeSlots[2].end
            : null,
      })
    );

    console.log("Saving availability to form:", weeklyAvailability);
    updateFormData("weeklyAvailability", weeklyAvailability);

    // Mark section as completed
    const hasAvailableDays = Object.values(availability).some(
      (data) => data.available
    );
    setCompletedSections((prev) => ({
      ...prev,
      [SectionId.AVAILABILITY]: hasAvailableDays,
    }));

    // Close section if it wasn't completed before
    if (!isCompleted && hasAvailableDays) {
      setExpandedSections((prev) => {
        const currentIndex = Object.values(SectionId).indexOf(
          SectionId.AVAILABILITY
        );
        const nextSection = Object.values(SectionId)[currentIndex + 1];

        if (nextSection) {
          return {
            ...prev,
            [SectionId.AVAILABILITY]: false,
            [nextSection]: true,
          };
        }

        return {
          ...prev,
          [SectionId.AVAILABILITY]: false,
        };
      });
    }
  };

  // Time editor dialog content
  const renderTimeEditorContent = () => {
    const dayInfo = daysOfWeek.find((d) => d.key === editingDay);

    return (
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("sections.availability.timeEditor.title")} {dayInfo?.fullName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick presets */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {t("sections.availability.timeEditor.quickSelection")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  key: "workDay",
                  label: t("sections.availability.timeEditor.presets.workDay"),
                  desc: "9:00 - 17:00",
                },
                {
                  key: "allDay",
                  label: t("sections.availability.timeEditor.presets.allDay"),
                  desc: "8:00 - 20:00",
                },
                {
                  key: "morning",
                  label: t("sections.availability.timeEditor.presets.morning"),
                  desc: "8:00 - 12:00",
                },
                {
                  key: "afternoon",
                  label: t(
                    "sections.availability.timeEditor.presets.afternoon"
                  ),
                  desc: "12:00 - 17:00",
                },
                {
                  key: "evening",
                  label: t("sections.availability.timeEditor.presets.evening"),
                  desc: "17:00 - 22:00",
                },
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    applyTimePreset(preset.key as any);
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
              {t("sections.availability.timeEditor.customTimes")}
            </h4>
            <div className="space-y-3">
              {editingTimeSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-2">
                        {t("sections.availability.timeEditor.startTime")}
                      </label>
                      <Select
                        value={slot.start}
                        onValueChange={(value) =>
                          updateTimeSlot(index, "start", value)
                        }
                      >
                        <SelectTrigger className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all">
                          <SelectValue
                            placeholder={t(
                              "sections.availability.timeEditor.selectTime"
                            )}
                          />
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
                        {t("sections.availability.timeEditor.endTime")}
                      </label>
                      <Select
                        value={slot.end}
                        onValueChange={(value) =>
                          updateTimeSlot(index, "end", value)
                        }
                      >
                        <SelectTrigger className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all">
                          <SelectValue
                            placeholder={t(
                              "sections.availability.timeEditor.selectTime"
                            )}
                          />
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                  + {t("sections.availability.timeEditor.addTimeSlot")}
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
            {t("sections.availability.timeEditor.cancel")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              saveTimeSlots();
            }}
            className="px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t("sections.availability.timeEditor.saveTimes")}
          </button>
        </DialogFooter>
      </DialogContent>
    );
  };

  return (
    <FormSection
      id={SectionId.AVAILABILITY}
      title={t("sections.availability.title")}
      icon={<Calendar size={18} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
    >
      <div className="space-y-6" onClick={() => console.log(formData)}>
        {/* Description */}
        <div>
          <p className="text-gray-600 mb-6">
            {t("sections.availability.description")}
          </p>
        </div>

        {/* Quick setup options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t("sections.availability.quickSettings")}
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
                  {index === 0 &&
                    t("sections.availability.quickActionsDesc.everyday")}
                  {index === 1 &&
                    t("sections.availability.quickActionsDesc.weekdays")}
                  {index === 2 &&
                    t("sections.availability.quickActionsDesc.weekend")}
                  {index === 3 &&
                    t("sections.availability.quickActionsDesc.clearAll")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t("sections.availability.availabilityPerDay")}
          </h3>
          <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-2">
            {daysOfWeek.map((day) => {
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
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-[13px] font-medium border-gray-300 rounded-lg bg-[#222222] hover:bg-black/80 text-white transition-colors"
                          >
                            {t("sections.availability.editTimes")}
                          </button>
                        </DialogTrigger>
                        {editingDay === day.key && renderTimeEditorContent()}
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
                          {t("sections.availability.noTimesSet")}
                        </p>
                      )}
                    </div>
                  )}

                  {!isSelected && (
                    <p className="text-gray-400 text-sm">
                      {t("sections.availability.notAvailableThisDay")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              saveToForm();
            }}
            disabled={
              !Object.values(availability).some((data) => data.available)
            }
            className={`w-full text-sm py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              Object.values(availability).some((data) => data.available)
                ? "bg-primary text-white hover:bg-primary/80"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isCompleted
              ? t("sections.availability.saveAvailability")
              : t("sections.availability.saveAndContinue")}
          </button>

          {!Object.values(availability).some((data) => data.available) && (
            <p className="text-center text-sm text-gray-500 mt-3">
              {t("sections.availability.selectAtLeastOneDay")}
            </p>
          )}
        </div>
      </div>
    </FormSection>
  );
};
