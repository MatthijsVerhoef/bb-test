import { motion } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface SearchButtonProps {
  location: string;
  dateRange: DateRange | undefined;
  onClick: () => void;
}

export const SearchButton = ({
  location,
  dateRange,
  onClick,
}: SearchButtonProps) => {
  const formatDate = (date: Date | undefined, fallback: string) => {
    return date ? format(date, "d MMM", { locale: nl }) : fallback;
  };

  const hasSearchData = location || dateRange?.from || dateRange?.to;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30"
    >
      <button
        onClick={onClick}
        className="flex items-center space-x-2 bg-white ps-5 pe-1 py-1 min-w-[400px] rounded-full cursor-pointer border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium">
          {hasSearchData ? (
            <>
              {location} <span className="mx-2">|</span>{" "}
              {formatDate(dateRange?.from, "Datums toevoegen")} -{" "}
              {formatDate(dateRange?.to, "Datums toevoegen")}
            </>
          ) : (
            "Zoek een aanhanger"
          )}
        </span>
        <div className="ms-auto bg-primary p-1.5 rounded-full text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </button>
    </motion.div>
  );
};
