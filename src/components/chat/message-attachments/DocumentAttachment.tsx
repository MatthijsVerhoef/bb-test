// src/components/chat/message-attachments/DocumentAttachment.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  File,
  FileImage,
  FileVideo,
  FileAudio,
} from "lucide-react";

interface DocumentData {
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface DocumentAttachmentProps {
  document: DocumentData;
  onClick?: () => void;
}

export function DocumentAttachment({
  document,
  onClick,
}: DocumentAttachmentProps) {
  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(lowerType)) {
      return FileImage;
    }
    if (["mp4", "avi", "mov", "wmv", "flv"].includes(lowerType)) {
      return FileVideo;
    }
    if (["mp3", "wav", "ogg", "m4a"].includes(lowerType)) {
      return FileAudio;
    }
    if (["pdf", "doc", "docx", "txt"].includes(lowerType)) {
      return FileText;
    }

    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const Icon = getFileIcon(document.type);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white border rounded-lg p-4 max-w-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick || (() => window.open(document.url, "_blank"))}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{document.name}</h4>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="uppercase">{document.type}</span>
            {document.size && (
              <>
                <span>•</span>
                <span>{formatFileSize(document.size)}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </motion.div>
  );
}
