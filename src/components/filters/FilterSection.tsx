import React, { useState } from "react";
import { ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

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
  // Always start with true, no localStorage check
  const [isOpen, setIsOpen] = useState(true);

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
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
