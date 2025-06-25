"use client";

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from "@/stores/auth.store";
import { toast } from 'sonner';

interface ProfileData {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
}

export function useProfileUpdater(initialData: ProfileData) {
  const { updateProfile, user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>(initialData || {});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Update local state when user changes in auth context
  useEffect(() => {
    if (user) {
      // Only update fields that exist in the user object
      const updatedData = { ...profileData };
      
      if (user.firstName !== undefined) updatedData.firstName = user.firstName;
      if (user.lastName !== undefined) updatedData.lastName = user.lastName;
      if (user.email !== undefined) updatedData.email = user.email;
      if (user.profilePicture !== undefined) updatedData.profilePicture = user.profilePicture;
      
      // Only update if there are actual changes
      if (JSON.stringify(updatedData) !== JSON.stringify(profileData)) {
        setProfileData(updatedData);
      }
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Submit profile update
  const handleProfileUpdate = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsUpdating(true);
    
    try {
      // Clean up data before sending (remove null values and email which can't be changed)
      const dataToUpdate = { ...profileData };
      delete dataToUpdate.email; // Email can't be changed

      // Filter out null/undefined values
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key as keyof ProfileData] === null || 
            dataToUpdate[key as keyof ProfileData] === undefined) {
          delete dataToUpdate[key as keyof ProfileData];
        }
      });
      
      // Send the update
      const updatedUser = await updateProfile(dataToUpdate);
      
      toast.success("Profile Updated", { 
        description: "Your profile information has been successfully updated." 
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Update Failed", { 
        description: "There was a problem updating your profile. Please try again." 
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [profileData, updateProfile]);

  // Upload profile picture
  const handleProfileImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const result = await response.json();
      
      // Update local state with new image URL
      setProfileData(prev => ({
        ...prev,
        profilePicture: result.url
      }));
      
      // Update profile with the new image URL
      await updateProfile({ profilePicture: result.url });
      
      toast.success("Image Uploaded", { 
        description: "Your profile picture has been updated successfully." 
      });
      
      return result.url;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error("Upload Failed", { 
        description: "There was a problem uploading your image. Please try again." 
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [updateProfile]);

  // Update specific field(s)
  const updateField = useCallback((name: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Reset form to initial data
  const resetForm = useCallback(() => {
    setProfileData(initialData);
  }, [initialData]);

  return {
    profileData,
    setProfileData,
    isUpdating,
    isUploading,
    handleInputChange,
    handleProfileUpdate,
    handleProfileImageUpload,
    updateField,
    resetForm
  };
}