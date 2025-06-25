// components/filters/FilterSection.tsx
import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const filterSectionVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: { opacity: 1, height: "auto", overflow: "visible" },
};

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionId: string;
}

export const FilterSection = ({
  title,
  children,
  defaultOpen = true,
  sectionId,
}: FilterSectionProps) => {
  const initialRenderRef = useRef(true);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setMounted(true);

    try {
      const savedState = localStorage.getItem("filterSectionStates");
      if (savedState) {
        const states = JSON.parse(savedState);
        if (states[sectionId] !== undefined) {
          setIsOpen(states[sectionId]);
        }
      }
    } catch (e) {
      console.error("Error reading filter state from localStorage:", e);
    }
  }, [sectionId]);

  useEffect(() => {
    if (!mounted || initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    try {
      const savedState = localStorage.getItem("filterSectionStates");
      const states = savedState ? JSON.parse(savedState) : {};
      states[sectionId] = isOpen;
      localStorage.setItem("filterSectionStates", JSON.stringify(states));
    } catch (e) {
      console.error("Error saving filter state to localStorage:", e);
    }
  }, [isOpen, sectionId, mounted]);

  return (
    <div className="pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-sm font-medium text-gray-900"
      >
        <h3>{title}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={filterSectionVariants}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
