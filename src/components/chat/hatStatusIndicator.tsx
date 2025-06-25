import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ChatStatusIndicatorProps {
  isApproved: boolean;
  needsApproval: boolean;
  userSentFirstMessage: boolean;
}

export function ChatStatusIndicator({
  isApproved,
  needsApproval,
  userSentFirstMessage,
}: ChatStatusIndicatorProps) {
  // Don't show anything if approval isn't needed
  if (!needsApproval) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center py-2"
    >
      {isApproved ? (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Chat goedgekeurd</span>
        </div>
      ) : userSentFirstMessage ? (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Wacht op goedkeuring</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Goedkeuring vereist</span>
        </div>
      )}
    </motion.div>
  );
}
