"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Share2,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";

interface ShareDialogProps {
  trailer: {
    id: string;
    title: string;
    city?: string;
    country?: string;
    pricePerDay: number;
    imageUrls: string[];
  };
  children?: React.ReactNode; // For custom trigger
}

export default function ShareDialog({ trailer, children }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('trailer');

  // Create share URL
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trailers/${trailer.id}`
      : `/trailers/${trailer.id}`;

  // Share text with title and price
  const shareText = t('share.shareText', { title: trailer.title, price: trailer.pricePerDay });

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share handlers
  const shareHandlers = {
    whatsapp: () => {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
        "_blank"
      );
    },
    facebook: () => {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`,
        "_blank"
      );
    },
    twitter: () => {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    },
    linkedin: () => {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`,
        "_blank"
      );
    },
    email: () => {
      window.open(
        `mailto:?subject=${encodeURIComponent(
          t('share.emailSubject')
        )}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
        "_blank"
      );
    },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="icon"
            className="shadow-none rounded-full"
          >
            <Share2 />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className=" p-8 rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-medium">
            {t('share.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 pb-4 pt-2">
          {/* Trailer preview */}
          <div className="flex items-center space-x-4 rounded-lg">
            <div className="relative w-24 h-22 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={trailer.imageUrls[0] || "/api/placeholder/200/120"}
                alt={trailer.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {trailer.title}
              </p>
              {trailer.city && (
                <p className="text-xs truncate text-gray-500 truncate">
                  {trailer.city}, {trailer.country || "Netherlands"}
                </p>
              )}
              <p className="text-sm font-semibold text-gray-900 mt-1">
                €{trailer.pricePerDay.toFixed(2)}/{t('booking.pricePerDay').split(' ')[1]}
              </p>
            </div>
          </div>

          {/* Share options */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="h-9 shadow-none flex items-center w-full rounded-lg bg-white border transition-colors"
            >
              <AnimatePresence initial={false} mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="h-4 flex items-center text-[13px] font-normal"
                  >
                    <Check className="h-4 w-4 me-2" strokeWidth={1.5} />
                    {t('share.linkCopied')}
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="h-4 flex items-center text-[13px] font-normal"
                  >
                    <Copy className="h-4 w-4 me-2" strokeWidth={1.5} />
                    {t('share.copyLink')}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 shadow-none w-full rounded-lg bg-white border transition-colors text-[13px] font-normal"
              onClick={shareHandlers.whatsapp}
            >
              <MessageCircle className="h-4" strokeWidth={1.5} />
              Whatsapp
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 shadow-none w-full rounded-lg bg-white border transition-colors text-[13px] font-normal"
              onClick={shareHandlers.facebook}
            >
              <Facebook className="h-4" strokeWidth={1.5} />
              Facebook
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 shadow-none w-full rounded-lg bg-white border transition-colors text-[13px] font-normal"
              onClick={shareHandlers.twitter}
            >
              <Twitter className="h-4 text-black" strokeWidth={1.5} />
              Twitter
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 shadow-none w-full rounded-lg bg-white border transition-colors text-[13px] font-normal"
              onClick={shareHandlers.linkedin}
            >
              <Linkedin className="h-4" strokeWidth={1.5} />
              LinkedIn
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 shadow-none w-full rounded-lg bg-white border transition-colors text-[13px] font-normal"
              onClick={shareHandlers.email}
            >
              <Mail className="h-4" strokeWidth={1.5} />
              Mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
