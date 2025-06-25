"use client";

import React, { useState, useEffect } from "react";
import { SectionId, TrailerFormData } from "../types";
import { FormSection } from "../components/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Info,
  Clock,
  Truck,
  FileText,
  CreditCard,
  ShieldCheck,
  Star,
  IdCard,
  Banknote,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExtraSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: React.Dispatch<React.SetStateAction<any>>;
  setExpandedSections: React.Dispatch<React.SetStateAction<any>>;
}

export function ExtraSection({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
}: ExtraSectionProps) {
  const { t } = useTranslation("addTrailer");

  return (
    <FormSection
      id="section-extra"
      title={t("sections.extra.title")}
      icon={<Info size={22} className="text-gray-600" />}
      isCompleted={isCompleted}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <p className="text-sm text-gray-500 mb-4">
        {t("sections.extra.description")}
      </p>
      <div className="space-y-6 py-2">
        {/* License Requirements */}
        <div className="space-y-3 pb-5 border-b border-gray-100">
          <h3 className="text-sm font-medium flex items-center">
            <IdCard size={20} strokeWidth={1.5} className="mr-2" />{" "}
            {t("sections.extra.license.title")}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {t("sections.extra.license.description")}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <Switch
              id="requiresDriversLicense"
              checked={formData.requiresDriversLicense || false}
              onCheckedChange={(checked) => {
                updateFormData("requiresDriversLicense", checked);
                if (!checked) {
                  updateFormData("licenseType", "none");
                }
              }}
            />
            <Label htmlFor="requiresDriversLicense" className="cursor-pointer">
              {t("sections.extra.license.required")}
            </Label>
          </div>

          {formData.requiresDriversLicense && (
            <div className="mt-3">
              <Label htmlFor="licenseType" className="block mb-1 text-sm">
                {t("sections.extra.license.type")}
              </Label>
              <Select
                value={formData.licenseType || "none"}
                onValueChange={(value) => updateFormData("licenseType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("sections.extra.license.none")}
                  </SelectItem>
                  <SelectItem value="B">
                    {t("sections.extra.license.b")}
                  </SelectItem>
                  <SelectItem value="BE">
                    {t("sections.extra.license.be")}
                  </SelectItem>
                  <SelectItem value="B+">
                    {t("sections.extra.license.bplus")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Delivery Options */}
        <div className="space-y-3 pb-5 border-b border-gray-100">
          <h3 className="text-sm font-medium flex items-center">
            <Truck size={20} strokeWidth={1.5} className="mr-2" />{" "}
            {t("sections.extra.delivery.title")}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {t("sections.extra.delivery.description")}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <Switch
              id="homeDelivery"
              checked={formData.homeDelivery || false}
              onCheckedChange={(checked) => {
                updateFormData("homeDelivery", checked);
              }}
            />
            <Label htmlFor="homeDelivery" className="cursor-pointer">
              {t("sections.extra.delivery.offer")}
            </Label>
          </div>

          {formData.homeDelivery && (
            <div className="space-y-3 mt-3">
              <div>
                <Label htmlFor="deliveryFee" className="block mb-1 text-sm">
                  {t("sections.extra.delivery.fee")}
                </Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="15.00"
                  value={formData.deliveryFee || ""}
                  onChange={(e) =>
                    updateFormData("deliveryFee", e.target.value)
                  }
                  className="w-full h-11 rounded-lg shadow-none mt-1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("sections.extra.delivery.freeDelivery")}
                </p>
              </div>

              <div>
                <Label
                  htmlFor="maxDeliveryDistance"
                  className="block mb-1 text-sm"
                >
                  {t("sections.extra.delivery.maxDistance")}
                </Label>
                <Input
                  id="maxDeliveryDistance"
                  type="number"
                  min="1"
                  placeholder="25"
                  value={formData.maxDeliveryDistance || ""}
                  onChange={(e) =>
                    updateFormData("maxDeliveryDistance", e.target.value)
                  }
                  className="w-full h-11 rounded-lg shadow-none mt-1.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Insurance */}
        <div className="space-y-3 pb-5 border-b border-gray-100">
          <h3 className="text-sm font-medium flex items-center">
            <ShieldCheck size={20} strokeWidth={1.5} className="mr-2" />{" "}
            {t("sections.extra.insurance.title")}
          </h3>

          <div className="flex items-center gap-2">
            <Switch
              id="includesInsurance"
              checked={formData.includesInsurance || false}
              onCheckedChange={(checked) => {
                updateFormData("includesInsurance", checked);
              }}
            />
            <Label htmlFor="includesInsurance" className="cursor-pointer">
              {t("sections.extra.insurance.included")}
            </Label>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="space-y-3 pb-5 border-b border-gray-100">
          <h3 className="text-sm font-medium flex items-center">
            <Banknote size={20} strokeWidth={1.5} className="mr-2" />{" "}
            {t("sections.extra.cancellation.title")}
          </h3>

          <div>
            <Label htmlFor="cancellationPolicy" className="block mb-1 text-sm">
              {t("sections.extra.cancellation.select")}
            </Label>
            <Select
              value={formData.cancellationPolicy || "flexible"}
              onValueChange={(value) =>
                updateFormData("cancellationPolicy", value)
              }
            >
              <SelectTrigger className="w-full h-11 rounded-lg shadow-none mt-1.5 min-h-11">
                <SelectValue placeholder="Select a cancellation policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">
                  {t("sections.extra.cancellation.flexible")}
                </SelectItem>
                <SelectItem value="moderate">
                  {t("sections.extra.cancellation.moderate")}
                </SelectItem>
                <SelectItem value="strict">
                  {t("sections.extra.cancellation.strict")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-0">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setCompletedSections((prev: any) => ({
                ...prev,
                [SectionId.EXTRA]: true,
              }));

              // Close current section and open next one
              setExpandedSections((prev: any) => {
                const sections = Object.values(SectionId);
                const currentIndex = sections.indexOf(SectionId.EXTRA);
                const nextSection =
                  currentIndex < sections.length - 1
                    ? sections[currentIndex + 1]
                    : sections[0];

                const newState = { ...prev };
                // Close this section
                newState[SectionId.EXTRA] = false;
                // Open the next section
                newState[nextSection] = true;

                return newState;
              });
            }}
          >
            {t("sections.extra.continue")}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
