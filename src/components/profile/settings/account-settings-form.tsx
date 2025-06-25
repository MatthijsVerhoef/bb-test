"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/client";

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

interface AccountSettingsFormProps {
  user: User;
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const { t } = useTranslation('profile');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.account.password.dialog.passwordMismatch'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('settings.account.password.dialog.passwordTooShort'));
      return;
    }

    try {
      // TODO: Implement API call to change password
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) throw new Error("Failed to change password");

      toast.success(t('settings.account.password.success'));
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user.email) {
      toast.error("E-mailadres komt niet overeen");
      return;
    }

    setIsDeleting(true);
    try {
      // Call the delete account API
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to delete account");

      toast.success("Account succesvol verwijderd");
      // Redirect to logout/home
      window.location.href = "/";
    } catch (error) {
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Password Section */}
      <div className="space-y-4">
        <div>
          <Lock className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">{t('settings.account.password.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.account.password.description')}
          </p>
        </div>

        <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-center">
              {t('settings.account.password.changeButton')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('settings.account.password.dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('settings.account.password.dialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('settings.account.password.dialog.currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">{t('settings.account.password.dialog.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('settings.account.password.dialog.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                {t('settings.account.password.dialog.cancel')}
              </Button>
              <Button onClick={handlePasswordChange}>{t('settings.account.password.dialog.change')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Management Section */}
      <div className="space-y-4">
        <div>
          <UserCircle className="size-5 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">{t('settings.account.accountManagement.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings.account.accountManagement.description')}
          </p>
        </div>

        <div className="space-y-3">
          {/* Deactivate Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-center">
                {t('settings.account.accountManagement.deactivateButton')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.account.accountManagement.deactivateDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.account.accountManagement.deactivateDialog.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('settings.account.accountManagement.deactivateDialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/user/deactivate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                      });
                      
                      if (!response.ok) throw new Error("Failed to deactivate account");
                      
                      toast.success("Account gedeactiveerd");
                      // Redirect to logout
                      window.location.href = "/api/auth/logout";
                    } catch (error) {
                      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
                    }
                  }}
                >
                  {t('settings.account.accountManagement.deactivateDialog.deactivate')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                {t('settings.account.accountManagement.deleteButton')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('settings.account.accountManagement.deleteDialog.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span>
                    {t('settings.account.accountManagement.deleteDialog.description')}
                  </span>
                  <span className="block text-sm font-medium text-gray-700 mt-4">
                    {t('settings.account.accountManagement.deleteDialog.confirmationLabel')}
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-3">
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={user.email}
                  className="w-full"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                  {t('settings.account.accountManagement.deleteDialog.cancel')}
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== user.email || isDeleting}
                >
                  {isDeleting ? t('settings.account.accountManagement.deleteDialog.deleting') : t('settings.account.accountManagement.deleteDialog.delete')}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}
