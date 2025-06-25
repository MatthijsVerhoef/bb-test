import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Truck,
  Star,
  Heart,
  CreditCard,
} from "lucide-react";

interface NotificationSettingsProps {
  user: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    languagePreference?: string;
  };
}

export default function NotificationSettings({
  user,
}: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Notification Settings
        </h2>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your account activity
                </p>
              </div>
              <Switch
                id="emailNotifications"
                defaultChecked={user.emailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your devices
                </p>
              </div>
              <Switch
                id="pushNotifications"
                defaultChecked={user.pushNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications" className="font-medium">
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive text messages for important updates
                </p>
              </div>
              <Switch
                id="smsNotifications"
                defaultChecked={user.smsNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications when you receive new messages
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Rental Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications about your trailer rentals
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Trailer Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Updates about trailer availability and status changes
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications about new reviews and ratings
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Payment Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications about payments and wallet updates
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Promotional Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Updates about special offers and promotions
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Frequency</CardTitle>
          <CardDescription>
            Control how often you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="realtime"
                name="emailFrequency"
                className="h-4 w-4 text-primary"
                defaultChecked
              />
              <div>
                <Label htmlFor="realtime" className="font-medium">
                  Real-time
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send emails as events happen
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="daily"
                name="emailFrequency"
                className="h-4 w-4 text-primary"
              />
              <div>
                <Label htmlFor="daily" className="font-medium">
                  Daily digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send a daily summary of all notifications
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="weekly"
                name="emailFrequency"
                className="h-4 w-4 text-primary"
              />
              <div>
                <Label htmlFor="weekly" className="font-medium">
                  Weekly digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send a weekly summary of all notifications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
