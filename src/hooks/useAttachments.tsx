import { useState, useCallback } from "react";
import { TrailerCard } from "@/components/chat/message-attachments/TrailerCard";
import { LocationMap } from "@/components/chat/message-attachments/LocationMap";
import { AvailabilityCalendar } from "@/components/chat/message-attachments/AvailabilityCalendar";
import { PhotoAttachment } from "@/components/chat/message-attachments/PhotoAttachment";
import { DocumentAttachment } from "@/components/chat/message-attachments/DocumentAttachment";
import { RentalTimeline } from "@/components/chat/message-attachments/RentalTimeline";

export type AttachmentType =
  | "trailer"
  | "location"
  | "availability"
  | "photo"
  | "document"
  | "rental";

export interface MessageAttachment {
  type: AttachmentType;
  data: any;
}

export function useAttachments() {
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);

  const handleAttachment = useCallback((type: AttachmentType, data: any) => {
    setAttachment({ type, data });
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachment(null);
  }, []);

  const renderAttachmentPreview = useCallback(() => {
    if (!attachment) return null;

    switch (attachment.type) {
      case "trailer":
        return <TrailerCard trailer={attachment.data} />;
      case "location":
        return <LocationMap location={attachment.data} />;
      case "availability":
        return (
          <AvailabilityCalendar
            availableDates={attachment.data.availableDates}
            unavailableDates={attachment.data.unavailableDates}
          />
        );
      case "photo":
        return (
          <PhotoAttachment
            imageUrl={attachment.data.url}
            caption={attachment.data.caption}
          />
        );
      case "document":
        return <DocumentAttachment document={attachment.data} />;
      case "rental":
        return <RentalTimeline rental={attachment.data} />;
      default:
        return null;
    }
  }, [attachment]);

  const renderAttachment = useCallback((attachmentData: any) => {
    if (!attachmentData) return null;

    try {
      const data =
        typeof attachmentData === "string"
          ? JSON.parse(attachmentData)
          : attachmentData;

      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      return data.map((item, index) => {
        if (!item?.type || !item?.data) return null;

        const key = `${item.type}-${index}`;

        switch (item.type) {
          case "trailer":
            return <TrailerCard key={key} trailer={item.data} />;
          case "location":
            return <LocationMap key={key} location={item.data} />;
          case "availability":
            return (
              <AvailabilityCalendar
                key={key}
                availableDates={item.data.availableDates}
                unavailableDates={item.data.unavailableDates}
              />
            );
          case "photo":
            return (
              <PhotoAttachment
                key={key}
                imageUrl={item.data.url}
                caption={item.data.caption || ""}
              />
            );
          case "document":
            return <DocumentAttachment key={key} document={item.data} />;
          case "rental":
            return <RentalTimeline key={key} rental={item.data} />;
          default:
            return null;
        }
      });
    } catch (e) {
      console.error("Error rendering attachment:", e);
      return null;
    }
  }, []);

  return {
    attachment,
    attachmentPreview: renderAttachmentPreview(),
    handleAttachment,
    removeAttachment,
    renderAttachment,
  };
}
