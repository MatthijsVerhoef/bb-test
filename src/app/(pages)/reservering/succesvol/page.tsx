// app/reservation/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  CheckCircle,
  Calendar,
  MapPin,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface RentalData {
  id: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  totalPrice: number;
  trailer: {
    id: string;
    title: string;
    images: Array<{ url: string }>;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  pickupLocation: string;
  returnLocation: string;
}

export default function ReservationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get("id") || searchParams.get("rentalId");
  const [rental, setRental] = useState<RentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rental details
  useEffect(() => {
    if (!rentalId) {
      setError("Geen reservering gevonden. Ga terug naar de homepagina.");
      setLoading(false);
      return;
    }

    const fetchRentalDetails = async () => {
      try {
        const response = await fetch(`/api/rentals/${rentalId}`);

        if (!response.ok) {
          throw new Error("Kon reservering niet laden");
        }

        const data = await response.json();
        setRental(data.rental);
      } catch (err) {
        console.error("Error fetching rental:", err);
        setError(
          "Er is een probleem opgetreden bij het laden van je reserveringsgegevens."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRentalDetails();
  }, [rentalId]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy", { locale: nl });
  };

  if (error || (!rental && !loading)) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-24 text-center">
        <div className="text-red-500 mb-4 text-5xl">!</div>
        <h1 className="text-2xl font-bold mb-4">Oeps! Er is iets misgegaan</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button onClick={() => router.push("/")}>Terug naar homepagina</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto pt-16 pb-12">
      <div className="relative rounded-2xl mb-4 px-6 pt-12 pb-12">
        <div className="mb-0 absolute top-6 left-8 flex items-center">
          <Button
            variant="ghost"
            className="flex items-center bg-[#f6f8f9] -ml-2 size-12 rounded-full"
            onClick={() => router.push("/")}
            disabled={loading}
          >
            <ArrowLeft className="size-5" />
          </Button>
        </div>

        <div className="flex bg-green-100/50 items-center px-4 py-2.5 mt-14 text-start border border-green-500 rounded-xl">
          <div className="bg-green-50 rounded-full">
            <CheckCircle className="size-8 text-green-500" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col ms-6">
            <h1 className="text-base font-medium">Reservering bevestigd!</h1>
            <p className="text-gray-600 max-w-md text-sm">
              Je aanhanger is succesvol gereserveerd. De verhuurder is op de
              hoogte gesteld van je reservering.
            </p>
          </div>
        </div>

        <Card className="border-0 p-0 mt-8 shadow-none rounded-none overflow-hidden">
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-medium">
              Reserveringsdetails
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-0 -mt-5">
            <div className="flex flex-col md:flex-row gap-6 pt-4">
              <div className="w-full md:w-1/3 relative h-44 rounded-xl overflow-hidden">
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : rental?.trailer.images &&
                  rental.trailer.images.length > 0 ? (
                  <Image
                    src={rental.trailer.images[0].url}
                    alt={rental.trailer.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Geen afbeelding</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                  </>
                ) : (
                  <>
                    <h2 className="font-medium text-lg mb-1">
                      {rental?.trailer.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                      Verhuurder: {rental?.trailer.owner.firstName}{" "}
                      {rental?.trailer.owner.lastName}
                    </p>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Huurperiode</span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-5 w-full" />
                    ) : (
                      <p className="text-sm">
                        {formatDate(rental!.startDate)} {rental!.pickupTime} -{" "}
                        {formatDate(rental!.endDate)} {rental!.returnTime}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Locatie</span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-5 w-full" />
                    ) : (
                      <p className="text-sm">{rental?.pickupLocation}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Betalingsoverzicht</h3>
              <div className="flex justify-between text-sm">
                <span>Totaal betaald</span>
                {loading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="font-medium">
                    €{rental?.totalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#f6f8f9] p-4 rounded-xl mt-4">
              <h3 className="font-medium mb-2">Wat gebeurt er nu?</h3>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Je ontvangt een bevestigingsmail met alle details van je
                    reservering. De verhuurder neemt contact met je op voor de
                    overdracht.
                  </p>
                  <p className="text-sm text-gray-600">
                    Je kunt je reservering bekijken en beheren in je account.
                  </p>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-0 p-0 rounded-0 justify-end w-full">
            <Button
              className="w-full h-10 rounded-lg"
              onClick={() => router.push("/profiel?tab=rentals&mode=renter")}
              disabled={loading}
            >
              {loading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                <>
                  Bekijk mijn reserveringen
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
