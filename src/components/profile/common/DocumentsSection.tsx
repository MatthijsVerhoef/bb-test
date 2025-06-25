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
import {
  FileText,
  Upload,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface DocumentsSectionProps {
  documents: {
    id: string;
    type: string;
    name: string | null;
    verified: boolean;
    expiryDate: Date | null;
    url: string;
  }[];
  role: "USER" | "LESSOR" | "ADMIN" | "SUPPORT";
}

export default function DocumentsSection({
  documents,
  role,
}: DocumentsSectionProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  // Check if a document is expired
  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  // Check if a document is about to expire (within 30 days)
  const isAboutToExpire = (date: Date | null) => {
    if (!date) return false;
    const expiry = new Date(date);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return expiry > today && expiry < thirtyDaysFromNow;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Documents</h2>
          <p className="text-muted-foreground">
            Manage your identification and verification documents
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center mr-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {document.name || document.type}
                      </h3>
                      {document.expiryDate && (
                        <p
                          className={`text-xs ${
                            isExpired(document.expiryDate)
                              ? "text-red-500"
                              : isAboutToExpire(document.expiryDate)
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isExpired(document.expiryDate)
                            ? "Expired: "
                            : isAboutToExpire(document.expiryDate)
                            ? "Expires soon: "
                            : "Expires: "}
                          {formatDate(document.expiryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  {document.verified ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : isExpired(document.expiryDate) ? (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-3 flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={document.url} target="_blank">
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  Replace
                </Button>
                {!document.verified && !isExpired(document.expiryDate) && (
                  <Button variant="default" size="sm">
                    Submit for Verification
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No Documents</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              You haven't uploaded any verification documents yet.
            </p>
            <Button className="mt-4">Upload Your First Document</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            These documents are required for account verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center mr-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">ID Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a government-issued photo ID like a passport or
                  driver's license
                </p>
              </div>
              <Button variant="outline" size="sm">
                Upload
              </Button>
            </div>

            {role === "LESSOR" && (
              <>
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center mr-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Business Registration</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your KVK registration document if you're renting as
                      a business
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload
                  </Button>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center mr-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Insurance Proof</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload proof of insurance for your trailer(s)
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Verification Process</CardTitle>
          <CardDescription>
            Learn how our verification process works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                <span className="font-medium text-primary">1</span>
              </div>
              <div>
                <h3 className="font-medium">Upload your documents</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit clear, readable copies of your documents through our
                  secure upload system.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                <span className="font-medium text-primary">2</span>
              </div>
              <div>
                <h3 className="font-medium">Verification review</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our team will review your documents within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                <span className="font-medium text-primary">3</span>
              </div>
              <div>
                <h3 className="font-medium">Verification complete</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Once verified, you'll receive a confirmation and your account
                  will be fully activated.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
