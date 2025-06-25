import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Lock, ShieldCheck, Key, Activity } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

export default function AccountSecurity() {
  const { t } = useTranslation("profile");
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('security.title')}</h2>
        <p className="text-muted-foreground">
          {t('security.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('security.changePassword.title')}</CardTitle>
          <CardDescription>
            {t('security.changePassword.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('security.changePassword.currentPassword')}</Label>
              <Input id="currentPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('security.changePassword.newPassword')}</Label>
              <Input id="newPassword" type="password" />
              <p className="text-xs text-muted-foreground">
                {t('security.changePassword.passwordRequirements')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('security.changePassword.confirmPassword')}</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline">{t('security.changePassword.cancel')}</Button>
          <Button>{t('security.changePassword.update')}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('security.twoFactor.title')}</CardTitle>
          <CardDescription>
            {t('security.twoFactor.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t('security.twoFactor.sms.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('security.twoFactor.sms.description')}
                </p>
              </div>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t('security.twoFactor.app.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('security.twoFactor.app.description')}
                </p>
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {t('security.twoFactor.info')}
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('security.loginHistory.title')}</CardTitle>
          <CardDescription>{t('security.loginHistory.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">
                  Login from Amsterdam, Netherlands
                </h3>
                <p className="text-xs text-muted-foreground">
                  Today at 10:45 AM • Chrome on Windows
                </p>
              </div>
              <Badge variant="outline" className="ml-2">
                {t('security.loginHistory.current')}
              </Badge>
            </div>

            <div className="flex items-start p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  Login from Amsterdam, Netherlands
                </h3>
                <p className="text-xs text-muted-foreground">
                  Yesterday at 8:12 PM • Safari on Mac
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-muted/30 rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  Login from Utrecht, Netherlands
                </h3>
                <p className="text-xs text-muted-foreground">
                  March 25, 2025 at 3:30 PM • Firefox on Mac
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            {t('security.loginHistory.viewFull')}
          </Button>
        </CardFooter>
      </Card>

      <Card className="bg-red-50/50 border-red-100">
        <CardHeader>
          <CardTitle className="text-red-600">{t('security.dangerZone.title')}</CardTitle>
          <CardDescription className="text-red-600/80">
            {t('security.dangerZone.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600/80 mb-4">
            {t('security.dangerZone.warning')}
          </p>
          <Button variant="destructive">{t('security.dangerZone.delete')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
