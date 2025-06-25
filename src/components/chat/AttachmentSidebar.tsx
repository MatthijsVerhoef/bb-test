import React from "react";
import {
  ImageIcon,
  FileText,
  MapPin,
  Package,
  CalendarDays,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AttachmentType } from "@/hooks/useAttachments";

interface AttachmentSidebarProps {
  onAttachment: (type: AttachmentType, data: any) => void;
  disabled?: boolean;
  isLessor?: boolean;
}

export function AttachmentSidebar({
  onAttachment,
  disabled = false,
  isLessor = false,
}: AttachmentSidebarProps) {
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onAttachment("photo", {
            url: event.target.result.toString(),
            caption: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAttachment("document", {
        name: file.name,
        url: "#",
        type: file.name.split(".").pop() || "unknown",
        size: file.size,
      });
    }
  };

  const handleShareLocation = () => {
    // In real app, this would use geolocation API
    onAttachment("location", {
      address: "Amsterdamseweg 123, 1182 GR Amstelveen",
      latitude: 52.3076865,
      longitude: 4.8727148,
    });
  };

  return (
    <div className="w-16 border-l flex flex-col items-center py-4 bg-white">
      <TooltipProvider>
        {/* Photo upload */}
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              className={`block mb-4 ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <ImageIcon size={18} strokeWidth={1.5} />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadPhoto}
                disabled={disabled}
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Upload een foto</p>
          </TooltipContent>
        </Tooltip>

        {/* Document upload */}
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              className={`block mb-4 ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <FileText size={18} strokeWidth={1.5} />
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleUploadDocument}
                disabled={disabled}
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Upload een document</p>
          </TooltipContent>
        </Tooltip>

        {/* Location sharing */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`block mb-4 ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={() => !disabled && handleShareLocation()}
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <MapPin size={18} strokeWidth={1.5} />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Deel een locatie</p>
          </TooltipContent>
        </Tooltip>

        {/* Trailer sharing */}
        <TrailerSharePopover onAttachment={onAttachment} disabled={disabled} />

        {/* Calendar for lessors */}
        {isLessor && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`block mb-4 ${
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={() => {
                  if (!disabled) {
                    // Mock data - in real app would fetch from API
                    onAttachment("availability", {
                      trailerId: "1",
                      availableDates: [
                        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                      ],
                      unavailableDates: [
                        new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
                      ],
                    });
                  }
                }}
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                  <CalendarDays size={18} strokeWidth={1.5} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Deel beschikbaarheid</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Rental Timeline */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`block mb-8 ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={() => {
                if (!disabled) {
                  // Mock data
                  onAttachment("rental", {
                    id: "1",
                    trailerId: "1",
                    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
                    status: "CONFIRMED",
                  });
                }
              }}
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <Clock size={18} strokeWidth={1.5} />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Deel huurperiode details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Separate component for trailer sharing
function TrailerSharePopover({
  onAttachment,
  disabled,
}: {
  onAttachment: (type: AttachmentType, data: any) => void;
  disabled?: boolean;
}) {
  // This should come from API/props in real app
  const myTrailers = [
    {
      id: "1",
      title: "Open aanhanger 750kg",
      pricePerDay: 25,
      location: "Amsterdam",
    },
    {
      id: "2",
      title: "Gesloten aanhanger 1500kg",
      pricePerDay: 35,
      location: "Utrecht",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={`block mb-4 ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
            <Package size={18} strokeWidth={1.5} />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent side="left" className="w-72 p-2">
        <h4 className="text-sm font-medium mb-2 px-2">Aanhangers</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {myTrailers.map((trailer) => (
            <div
              key={trailer.id}
              className="border rounded p-2 hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium">{trailer.title}</p>
              <p className="text-xs text-muted-foreground">
                {trailer.location}
              </p>
              <p className="text-xs">€{trailer.pricePerDay}/dag</p>
              <div className="flex justify-between mt-2">
                <button
                  className="text-xs h-8 px-3 py-1 bg-gray-100 rounded-md border hover:bg-gray-200 transition-colors"
                  onClick={() => onAttachment("trailer", trailer)}
                  disabled={disabled}
                >
                  Delen
                </button>
                <button
                  className="text-xs h-8 px-3 py-1 bg-gray-100 rounded-md border hover:bg-gray-200 transition-colors"
                  onClick={() =>
                    onAttachment("availability", {
                      trailerId: trailer.id,
                      availableDates: [
                        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                      ],
                      unavailableDates: [],
                    })
                  }
                  disabled={disabled}
                >
                  Beschikbaarheid
                </button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
