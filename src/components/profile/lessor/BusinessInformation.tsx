import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building, CreditCard, HelpCircle } from "lucide-react";

interface BusinessInformationProps {
  user: {
    companyName: string | null;
    kvkNumber: string | null;
    vatNumber: string | null;
  };
}

export default function BusinessInformation({
  user,
}: BusinessInformationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Business Information
        </h2>
        <p className="text-muted-foreground">
          Manage your business details as a trailer owner
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>
            These details will be used for invoicing and business verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  defaultValue={user.companyName || ""}
                  placeholder="Enter your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kvkNumber">
                  <span className="flex items-center">
                    KVK Number
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </span>
                </Label>
                <Input
                  id="kvkNumber"
                  defaultValue={user.kvkNumber || ""}
                  placeholder="Dutch Chamber of Commerce number"
                />
                <p className="text-xs text-muted-foreground">
                  Your Dutch Chamber of Commerce registration number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">
                  <span className="flex items-center">
                    VAT Number
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </span>
                </Label>
                <Input
                  id="vatNumber"
                  defaultValue={user.vatNumber || ""}
                  placeholder="e.g. NL123456789B01"
                />
                <p className="text-xs text-muted-foreground">
                  Your Value Added Tax identification number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <select
                  id="businessType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select business type</option>
                  <option value="soleProprietor">Sole Proprietor (ZZP)</option>
                  <option value="partnership">Partnership (VOF)</option>
                  <option value="llc">Limited Liability (BV)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your trailer rental business"
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                This information will be visible to potential renters on your
                profile
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
          <CardDescription>
            Where we should send your rental payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input id="accountHolder" placeholder="Name on bank account" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input id="iban" placeholder="e.g. NL91ABNA0417164300" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="e.g. ABN AMRO, ING, Rabobank"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Banking Details</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
          <CardDescription>
            Configure tax settings for your trailer rental business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxPercentage">VAT Percentage</Label>
                <select
                  id="taxPercentage"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="21">21% (Standard rate)</option>
                  <option value="9">9% (Reduced rate)</option>
                  <option value="0">0% (Zero rate)</option>
                  <option value="exempt">VAT Exempt</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceSeries">Invoice Number Prefix</Label>
                <Input id="invoiceSeries" placeholder="e.g. TR-2023-" />
                <p className="text-xs text-muted-foreground">
                  Custom prefix for your invoice numbers
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Tax Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
