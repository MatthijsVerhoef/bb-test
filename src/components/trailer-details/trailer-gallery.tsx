"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ExpandIcon } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "@/lib/i18n/client";

interface TrailerGalleryProps {
  images: string[];
  title: string;
  trailer: any;
}

export default function TrailerGallery({
  images,
  title,
  trailer,
}: TrailerGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation("trailer");

  // Navigate through main gallery images
  const navigateMainGallery = (direction: "next" | "prev") => {
    if (direction === "next") {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    } else {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + images.length) % images.length
      );
    }
  };

  // Open lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Navigate through lightbox images
  const navigateLightbox = (direction: "next" | "prev") => {
    if (direction === "next") {
      setLightboxIndex((prevIndex) => (prevIndex + 1) % images.length);
    } else {
      setLightboxIndex(
        (prevIndex) => (prevIndex - 1 + images.length) % images.length
      );
    }
  };

  // If no images available, show placeholder
  if (images.length === 0) {
    return (
      <div className="rounded-lg bg-gray-100 min-h-72 flex items-center justify-center">
        <p className="text-gray-500">{t("gallery.noImages")}</p>
      </div>
    );
  }

  // Calculate indices for secondary images
  const secondIndex = (currentIndex + 1) % images.length;
  const thirdIndex = (currentIndex + 2) % images.length;

  return (
    <>
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        onClick={() => console.log(trailer)}
      >
        {/* Main image column (larger) */}
        <div
          className="col-span-1 sm:col-span-2 bg-gray-100 relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => openLightbox(currentIndex)}
        >
          {/* Main Image */}
          <Image
            src={images[currentIndex]}
            alt={`${title} - Main Image ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
          />

          {/* Navigation Arrows (visible only on hover) */}
          {isHovered && images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white z-10 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMainGallery("prev");
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white z-10 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMainGallery("next");
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Expand Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-black/50 text-white z-10 hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(currentIndex);
            }}
          >
            <ExpandIcon className="h-5 w-5" />
          </Button>

          {/* Image Counter */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Secondary Images Column */}
        <div className="hidden sm:block col-span-1 grid grid-rows-2 gap-2">
          {/* Second Image */}
          {images.length > 1 && (
            <div
              className="relative bg-gray-100 aspect-[4/3] overflow-hidden rounded-lg cursor-pointer"
              onClick={() => {
                setCurrentIndex(secondIndex);
                openLightbox(secondIndex);
              }}
            >
              <Image
                src={images[secondIndex]}
                alt={`${title} - Additional Image 2`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            </div>
          )}

          {/* Third Image */}
          {images.length > 2 && (
            <div
              className="relative aspect-[4/3] mt-[6px] bg-gray-100 overflow-hidden rounded-lg cursor-pointer"
              onClick={() => {
                setCurrentIndex(thirdIndex);
                openLightbox(thirdIndex);
              }}
            >
              <Image
                src={images[thirdIndex]}
                alt={`${title} - Additional Image 3`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            </div>
          )}

          {/* If there's only one image, show placeholder for second slot */}
          {images.length === 1 && (
            <div className="bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                {t("gallery.noMoreImages")}
              </p>
            </div>
          )}

          {/* If there are only two images, show placeholder for third slot */}
          {images.length === 2 && (
            <div className="bg-gray-100 mt-2 h-48 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                {t("gallery.noMoreImages")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogTitle className="hidden">{t("gallery.dialog")}</DialogTitle>
        <DialogContent className="min-w-[83vw] p-0 bg-black/95 border-0">
          <div className="relative h-[80vh] w-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-full bg-black/50 text-white z-10 hover:bg-black/70"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white z-10 hover:bg-black/70"
              onClick={() => navigateLightbox("prev")}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <div className="relative h-full w-full flex items-center justify-center">
              <Image
                src={images[lightboxIndex]}
                alt={`${title} - Lightbox ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white z-10 hover:bg-black/70"
              onClick={() => navigateLightbox("next")}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black/70 px-4 py-2 rounded-full text-white text-sm">
                {lightboxIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
