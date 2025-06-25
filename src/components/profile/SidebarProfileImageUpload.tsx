"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth.store";
import { useTranslation } from "@/lib/i18n/client";

interface SidebarProfileImageUploadProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
}

export default function SidebarProfileImageUpload({
  user,
}: SidebarProfileImageUploadProps) {
  const { updateProfile } = useAuth();
  const { t } = useTranslation("profile");
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user.profilePicture || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("personalInfo.form.profilePicture.fileTooBig"), {
        description: t("personalInfo.form.profilePicture.fileSizeLimit"),
      });
      return;
    }

    // Validate file type
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      toast.error(t("personalInfo.form.profilePicture.invalidFileType"), {
        description: t("personalInfo.form.profilePicture.allowedFileTypes"),
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file
      const response = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile picture");
      }

      const result = await response.json();

      // Preview the image immediately
      setProfileImage(result.url);

      // Update the user profile with the new image URL
      await updateProfile({ profilePicture: result.url });

      toast.success(t("personalInfo.form.profilePicture.uploadSuccess"), {
        description: t("personalInfo.form.profilePicture.updateSuccess"),
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error(t("personalInfo.form.profilePicture.uploadFailed"), {
        description: t("personalInfo.form.profilePicture.uploadError"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <Avatar className="size-32 mx-auto">
        <AvatarImage
          src={profileImage}
          alt={`${user.firstName} ${user.lastName}`}
          className="object-cover"
        />
        <AvatarFallback className="text-lg">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </AvatarFallback>
      </Avatar>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Camera button */}
      <Button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="absolute bottom-0 right-0 rounded-full shadow-md size-9 p-0"
        variant="secondary"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
