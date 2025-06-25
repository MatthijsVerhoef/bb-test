"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Truck,
  Users,
  Shield,
  Coins,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

const FAQSection = () => {
  const { t } = useTranslation('home');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems = [
    {
      key: 'howItWorks',
      icon: Truck,
    },
    {
      key: 'safety',
      icon: Shield,
    },
    {
      key: 'benefits',
      icon: Coins,
    },
    {
      key: 'howToRent',
      icon: Users,
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">
          {t('faq.title')}
        </h2>
        <p className="text-gray-600 text-lg">
          {t('faq.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {faqItems.map((item, index) => {
          const Icon = item.icon;
          const isOpen = openIndex === index;
          const title = t(`faq.items.${item.key}.title`);
          const content = t(`faq.items.${item.key}.content`);

          return (
            <div
              key={index}
              className={`rounded-xl bg-white border-2 ${
                isOpen ? "border-primary" : "border-gray-100"
              } transition-all duration-300 hover:shadow-lg`}
            >
              <button
                className="w-full p-6 text-left flex items-center justify-between"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-full ${
                      isOpen ? "bg-primary/10" : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isOpen ? "text-primary" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-lg max-w-md">{title}</h3>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-0">
                  <div className="pl-[60px]">
                    {Array.isArray(content) ? (
                      content.map((line, i) => (
                        <p
                          key={i}
                          className={`text-gray-600 ${
                            i === 0 ? "font-medium mb-2" : ""
                          }`}
                        >
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-600">{content}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-600 mb-6">
          {t('faq.moreQuestions')}
        </p>
        <div className="flex justify-center space-x-6">
          <a
            href="/contact"
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            {t('faq.contact')}
          </a>
          <a
            href="/how-it-works"
            className="px-6 py-3 border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
          >
            {t('faq.howItWorksLink')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;