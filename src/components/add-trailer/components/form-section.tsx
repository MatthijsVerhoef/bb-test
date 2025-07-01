"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { FormSectionProps } from "../types";

export const FormSection: React.FC<FormSectionProps> = ({
  id,
  title,
  icon,
  isCompleted,
  isExpanded,
  summary,
  onToggle,
  paddingTop = true,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  useLayoutEffect(() => {
    if (contentRef.current && !isInitialized) {
      if (isExpanded) {
        const scrollHeight = contentRef.current.scrollHeight;
        setHeight(`${scrollHeight}px`);
      } else {
        setHeight("0px");
      }
      setIsInitialized(true);
    }
  }, [isExpanded, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !contentRef.current) return;

    if (isExpanded) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(`${scrollHeight}px`);
    } else {
      setHeight("0px");
    }
  }, [isExpanded, isInitialized]);

  useEffect(() => {
    if (!isExpanded || !contentRef.current || !isInitialized) return;

    const updateHeight = () => {
      if (contentRef.current && isExpanded) {
        const scrollHeight = contentRef.current.scrollHeight;
        setHeight(`${scrollHeight}px`);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isExpanded, isInitialized]);

  return (
    <div
      id={`section-${id}`}
      className="border-b border-gray-200 last:border-b-0"
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-0 flex items-center justify-between hover:opacity-80 transition-opacity duration-200 ${
          paddingTop ? "py-6" : "pb-6 pt-4"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${
              isCompleted ? "bg-black text-white" : "text-black"
            }`}
          >
            {isCompleted ? (
              <Check size={16} strokeWidth={3} />
            ) : (
              <span className="text-xs text-black">{icon}</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
            {summary && !isExpanded && (
              <p className="text-sm text-gray-500 mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        <ChevronsUpDown
          size={20}
          className={`text-gray-400 transition-transform duration-300 ease-in-out ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden ${
          isInitialized ? "transition-all duration-300 ease-in-out" : ""
        }`}
        style={{
          height: height,
        }}
      >
        <div ref={contentRef} className="pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};
