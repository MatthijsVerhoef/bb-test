"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Trophy,
  Star,
  Clock,
  CreditCard,
  Users,
  Shield,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TrailerCategory {
  title: string;
  slug: string;
  description: string;
  iconName: string;
  benefits: string[];
}

const infoData = [
  {
    id: 1,
    title: "Plaats jouw aanhanger online",
    image: "/place-online.png",
    description:
      "Maak in een paar klikken een advertentie aan: upload foto’s, bepaal de huurprijs en kies beschikbare dagen. Zo staat jouw aanhanger direct in de spotlights!",
  },
  {
    id: 2,
    title: "Wacht op een huurder",
    image: "/wait-for-renter.png",
    description:
      "Ontspan terwijl geïnteresseerden je aanvragen sturen. Jij beslist wie er op pad gaat – veilig en verzekerd via ons platform.",
  },
  {
    id: 3,
    title: "Verhuur je aanhanger",
    image: "/rent-trailer.png",
    description:
      "Ontmoet de huurder, loop samen een snelle check-in rondje en overhandig de sleutel. Betaling én verzekering zijn al geregeld, dus zorgeloos verhuren gegarandeerd.",
  },
];

export default function TrailerSeoContent() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-100 mt-20 flex items-start relative py-8 px-16 overflow-hidden min-h-[800px] rounded-3xl mx-auto w-[1200px] max-w-[100vw]">
      <div className="flex flex-col">
        <h1 className="font-extrabold mt-5 text-4xl text-[#1e1818]">
          Plaats jouw aanhanger
        </h1>
      </div>
      <img
        alt=""
        src="/place-online.png"
        className="absolute -right-[250px] rounded-l-2xl h-[700px] top-1/2 transform -translate-y-1/2"
      />
      {/* <div className="container mx-auto px-4">
        {infoData.map((data, i) => (
          <div
            key={data.id}
            className={`flex items-center my-12 ${
              i === 1 && "flex-row-reverse"
            }`}
          >
            <img
              alt={data.title}
              src={data.image}
              className="size-52 min-w-52 rounded-lg object-cover"
            />
            <div className={`flex flex-col ${i === 1 ? "me-8" : "ms-8"}`}>
              <h2 className="font-medium text-lg">{data.title}</h2>
              <p className="mt-2">{data.description}</p>
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}
