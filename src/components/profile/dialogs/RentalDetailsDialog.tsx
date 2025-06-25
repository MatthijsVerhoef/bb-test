import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Truck,
  ShieldCheck,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  RentalDetailsProps,
  PaymentStatus,
  RentalStatus,
  DamageStatus,
} from "./types";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getPaymentStatusColor,
  getDamageStatusColor,
} from "./utils";
import { StatusBadge } from "./components/StatusBadge";
import { PaymentSummary } from "./components/PaymentSummary";
import { ContactInfo } from "./components/ContactInfo";

export function RentalDetailsDialog({
  rental,
  role,
  onClose,
}: RentalDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");

  const durationDays = Math.ceil(
    (new Date(rental.endDate).getTime() -
      new Date(rental.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const hasDamageReports =
    rental.damageReports && rental.damageReports.length > 0;
  const hasInsuranceClaims =
    rental.insuranceClaims && rental.insuranceClaims.length > 0;
  const hasExtensions =
    rental.rentalExtensions && rental.rentalExtensions.length > 0;

  return (
    <DialogContent className="max-w-md md:max-w-1.5xl max-h-[90vh] p-0 flex flex-col rounded-2xl overflow-hidden">
      <DialogHeader className="p-8 pb-2">
        <DialogTitle className="flex items-center justify-between">
          <span>Details over deze verhuring</span>
          <StatusBadge status={rental.status} className="ml-2" />
        </DialogTitle>
        <DialogDescription>
          Booking #{rental.id.substring(0, 8)}
        </DialogDescription>
      </DialogHeader>

      <Tabs
        defaultValue="details"
        className="w-full flex flex-col flex-1 overflow-hidden"
        onValueChange={setActiveTab}
      >
        <TabsList className="flex mx-8 bg-white gap-x-2 mb-2 overflow-x-auto h-[42px] max-w-full overflow-y-hidden shrink-0">
          <TabsTrigger
            value="details"
            className="rounded-full flex-nowrap shadow-none data-[state=active]:bg-[#222222] data-[state=active]:text-white text-[13px] py-4 bg-gray-100 px-5"
          >
            Overzicht
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="rounded-full flex-nowrap shadow-none data-[state=active]:bg-[#222222] data-[state=active]:text-white text-[13px] py-4 bg-gray-100 px-5"
          >
            Betaling
            {rental.payment?.status === PaymentStatus.PENDING && (
              <span className="ml-1 h-2 w-2 bg-primary rounded-full"></span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="Instructies"
            className="rounded-full flex-nowrap shadow-none data-[state=active]:bg-[#222222] data-[state=active]:text-white text-[13px] py-1.5 bg-gray-100 px-5"
          >
            Instructies
          </TabsTrigger>
          <TabsTrigger
            value="damage"
            disabled={!hasDamageReports && !hasInsuranceClaims}
            className="rounded-full flex-nowrap shadow-none data-[state=active]:bg-[#222222] data-[state=active]:text-white text-[13px] py-4 bg-gray-100 px-5"
          >
            Schade
            {hasDamageReports ? (
              <span className="ml-1 text-xs bg-orange-100 text-orange-800 rounded-full px-1.5">
                {rental.damageReports?.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="details"
          className="space-y-4 overflow-y-auto flex-1 px-8 pb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="rounded-md overflow-hidden relative h-16 w-26">
                  {rental.trailerImage ? (
                    <Image
                      src={rental.trailerImage}
                      alt={rental.trailerTitle}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Truck className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col ms-5">
                  <div>
                    <h3 className="text-base font-medium">
                      {rental.trailerTitle}
                    </h3>
                    {rental.trailer?.licensePlate && (
                      <>
                        <span className="text-sm font-medium">
                          {formatDateTime(rental.startDate)} -{" "}
                          {rental.endDate && (
                            <>{formatDateTime(rental.endDate)}</>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="space-y-4">
                  <div className="flex flex-col items-start mt-2 text-sm">
                    <span className="font-medium">Huur periode:</span>
                    <span className="text-gray-500 mt-0.5">
                      {formatDateTime(rental.startDate)} -{" "}
                      {rental.endDate && <>{formatDateTime(rental.endDate)}</>}
                    </span>
                  </div>
                  <div className="flex flex-col items-start mt-2 text-sm">
                    <span className="font-medium">Locatie:</span>
                    <div className="flex w-full items-center mt-0.5">
                      <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="">
                        {rental?.trailer?.address},{" "}
                        {rental?.trailer?.postalCode}, {rental?.trailer?.city}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://maps.google.com/?q=${encodeURIComponent(
                              rental.pickupLocation || ""
                            )}`,
                            "_blank"
                          );
                        }}
                      >
                        Bekijk op kaart
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <PaymentSummary rental={rental} />

              {rental.insurancePolicy && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium">Insurance</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Provider</span>
                      <span>{rental.insurancePolicy.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span>{rental.insurancePolicy.type}</span>
                    </div>
                    {rental.insurancePolicy.deductible && (
                      <div className="flex justify-between">
                        <span>Deductible</span>
                        <span>
                          {formatCurrency(rental.insurancePolicy.deductible)}
                        </span>
                      </div>
                    )}
                    {rental.insurancePolicy.coverageDetails && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {rental.insurancePolicy.coverageDetails}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {role === "LESSOR" && rental.renter && (
                <ContactInfo
                  person={rental.renter}
                  label="Huurder"
                  showPhone={true}
                  showEmail={true}
                  showChat={false}
                />
              )}

              {role !== "LESSOR" && rental.lessor && (
                <ContactInfo
                  person={rental.lessor}
                  label="Verhuurder"
                  showPhone={false}
                  showEmail={true}
                  showChat={true}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="damage"
          className="space-y-6 overflow-y-auto flex-1 px-8 pb-8"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Damage Reports</h3>
            {rental.damageReports && rental.damageReports.length > 0 ? (
              <div className="space-y-4">
                {rental.damageReports.map((damage) => (
                  <Card key={damage.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Damage Report
                        </CardTitle>
                        <Badge
                          variant={
                            getDamageStatusColor(damage.damageStatus) as any
                          }
                        >
                          {String(damage.damageStatus).replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{damage.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Reported on {formatDate(damage.date)}
                        </span>
                        {damage.repairCost && (
                          <span>
                            Repair cost: {formatCurrency(damage.repairCost)}
                          </span>
                        )}
                      </div>
                      {damage.photoUrls && damage.photoUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {damage.photoUrls.slice(0, 3).map((url, index) => (
                            <div
                              key={index}
                              className="relative h-20 rounded-md overflow-hidden"
                            >
                              <Image
                                src={url}
                                alt={`Damage photo ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {damage.resolved ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 mt-2"
                        >
                          Resolved
                        </Badge>
                      ) : (
                        role === "LESSOR" && (
                          <Button size="sm" variant="outline" className="mt-2">
                            Mark as Resolved
                          </Button>
                        )
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border rounded-md">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">
                  No damage reports
                </p>
              </div>
            )}

            {hasInsuranceClaims && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Insurance Claims</h3>
                <div className="space-y-4">
                  {rental.insuranceClaims!.map((claim) => (
                    <Card key={claim.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {claim.claimNumber
                              ? `Claim #${claim.claimNumber}`
                              : "Insurance Claim"}
                          </CardTitle>
                          <Badge variant="outline">{claim.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">{claim.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Filed on {formatDate(claim.date)}
                          </span>
                          {claim.amount && (
                            <span>
                              Claim amount: {formatCurrency(claim.amount)}
                            </span>
                          )}
                        </div>
                        {claim.evidenceUrls &&
                          Array.isArray(claim.evidenceUrls) &&
                          claim.evidenceUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {claim.evidenceUrls
                                .slice(0, 3)
                                .map((url, index) => (
                                  <div
                                    key={index}
                                    className="relative h-20 rounded-md overflow-hidden"
                                  >
                                    <Image
                                      src={url}
                                      alt={`Evidence photo ${index + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="payment"
          className="space-y-4 overflow-y-auto flex-1 px-8 pb-8"
        >
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Betalings details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rental.payment ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Totaal</h4>
                        <p className="text-sm">
                          {formatCurrency(rental.payment.amount)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Status</h4>
                        <Badge
                          variant={
                            getPaymentStatusColor(rental.payment.status) as any
                          }
                          className="text-sm font-normal p-0 border-0"
                        >
                          {String(rental.payment.status).replace("_", " ")}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Betalingsmethode
                        </h4>
                        <p>{rental.payment.paymentMethod}</p>
                      </div>
                    </div>

                    {(rental.payment.refundAmount ||
                      rental.payment.refundReason) && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <h4 className="text-sm font-medium mb-2">
                          Refund Information
                        </h4>
                        <div className="space-y-2">
                          {rental.payment.refundAmount && (
                            <div className="flex justify-between text-sm">
                              <span>Refund Amount</span>
                              <span>
                                {formatCurrency(rental.payment.refundAmount)}
                              </span>
                            </div>
                          )}
                          {rental.payment.refundDate && (
                            <div className="flex justify-between text-sm">
                              <span>Refund Date</span>
                              <span>
                                {formatDate(rental.payment.refundDate)}
                              </span>
                            </div>
                          )}
                          {rental.payment.refundReason && (
                            <div className="text-sm mt-2">
                              <span className="font-medium">Reason: </span>
                              <span>{rental.payment.refundReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {role === "LESSOR" &&
                      rental.securityDeposit &&
                      rental.securityDeposit > 0 &&
                      rental.status === RentalStatus.COMPLETED && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">
                            Security Deposit
                          </h4>
                          <div className="flex justify-between items-center">
                            <span>
                              {formatCurrency(rental.securityDeposit)}
                            </span>
                            <Button size="sm" variant="outline">
                              Process Refund
                            </Button>
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No payment information available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <PaymentSummary rental={rental} showStatus={false} />
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="space-y-4 overflow-y-auto flex-1 px-8 pb-8"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rental Extensions</h3>
            {hasExtensions ? (
              <div className="space-y-4">
                {rental.rentalExtensions!.map((extension) => (
                  <Card key={extension.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Rental Extension</h4>
                          <Badge
                            variant={
                              extension.approved === true
                                ? "success"
                                : extension.approved === false
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {extension.approved === true
                              ? "Approved"
                              : extension.approved === false
                              ? "Declined"
                              : "Pending"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Original End Date
                            </p>
                            <p className="font-medium">
                              {formatDate(extension.originalEndDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              New End Date
                            </p>
                            <p className="font-medium">
                              {formatDate(extension.newEndDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Additional Cost
                            </p>
                            <p className="font-medium">
                              {formatCurrency(extension.additionalCost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Requested On
                            </p>
                            <p className="font-medium">
                              {formatDate(extension.requestDate)}
                            </p>
                          </div>
                        </div>
                        {extension.note && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Note</p>
                            <p className="mt-1 p-2 bg-muted rounded-md">
                              {extension.note}
                            </p>
                          </div>
                        )}
                        {role === "LESSOR" && extension.approved === null && (
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button size="sm" variant="destructive">
                              Decline
                            </Button>
                            <Button size="sm">Approve</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border rounded-md">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">
                  No rental extensions
                </p>
                {role !== "LESSOR" && rental.status === RentalStatus.ACTIVE && (
                  <Button size="sm" variant="outline" className="mt-4">
                    Request Extension
                  </Button>
                )}
              </div>
            )}

            {rental.cancellationDate && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Cancellation Details
                </h3>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Cancellation Date
                          </p>
                          <p className="font-medium">
                            {formatDate(rental.cancellationDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant="destructive">Cancelled</Badge>
                        </div>
                      </div>
                      {rental.cancellationReason && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Reason</p>
                          <p className="mt-1 p-2 bg-muted rounded-md">
                            {rental.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="px-8 pb-6 pt-0 shrink-0">
        <Button variant="outline" onClick={onClose}>
          Sluiten
        </Button>
        {role === "LESSOR" && rental.status === RentalStatus.CONFIRMED && (
          <Button>Contact Renter</Button>
        )}
        {role !== "LESSOR" && rental.status === RentalStatus.CONFIRMED && (
          <Button>Contact Lessor</Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
