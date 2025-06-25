import React from "react";
import { Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  attachment?: React.ReactNode;
  onRemoveAttachment?: () => void;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Typ je bericht...",
  attachment,
  onRemoveAttachment,
}: MessageInputProps) {
  return (
    <form onSubmit={onSubmit} className="shadow-2xl px-4 py-3">
      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-4 rounded-lg overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <button
                type="button"
                className="rounded-full h-6 w-6 p-0 flex items-center justify-center ms-auto bg-gray-200"
                onClick={onRemoveAttachment}
              >
                <X size={14} />
              </button>
            </div>
            {attachment}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex space-x-2 bg-gray-200 relative rounded-full">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 py-5.5 rounded-full outline-none shadow-none border-none px-4 placeholder:text-black text-black disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          className={`rounded-full size-9 me-1 relative top-1 flex items-center justify-center bg-black text-white p-2 ${
            value.trim() === "" && !attachment ? "opacity-50" : "opacity-100"
          }`}
          disabled={disabled || (value.trim() === "" && !attachment)}
        >
          <Send className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </form>
  );
}
