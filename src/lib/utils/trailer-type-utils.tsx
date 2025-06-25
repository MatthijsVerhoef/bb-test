/**
 * Comprehensive Trailer Type Utilities
 * 
 * This file consolidates all trailer-related static information including:
 * - Type definitions and mappings
 * - Icons and standardized styling
 * - Descriptions and specifications
 * - Pricing information
 * - Feature lists and characteristics
 * - Validation and formatting utilities
 */

import { ReactNode } from "react";
import { TrailerType } from "@prisma/client";

// Icon imports
import {
  BoatTrailerDouble,
  BicycleTrailer,
  BicycleTrailerDouble,
  BikeTrailer,
  CarTrailer,
  ClosedTrailer,
  ClosedTrailerDouble,
  FlatTrailer,
  FlatTrailerClosed,
  FlatTrailerClosedDouble,
  HorseTrailer,
  PlateauTrailer,
  PlateauTrailerDouble,
  TransportTrailer,
  TransportTrailerDouble,
  UnbrakedTrailer,
  UnbrakedTrailerDouble,
  Hitch,
  TipperTrailer,
  TipperTrailerDouble,
  BagageTrailer,
  DrawBarTrailer,
  FoodTrailer,
  CampingTrailer,
  Ramps,
  Net,
  Pilon2,
  Wheelbarrow,
  LongLoad,
  PlugLeft,
  PlugRight,
} from "@/lib/icons/trailer-icons";
import { TruckIcon, Lock, Frame } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TrailerTypeDetails {
  icon: JSX.Element;
  name: string;
  description: ReactNode;
  features?: string[];
  specifications: TrailerSpecifications;
  category: TrailerCategory;
  averagePrice: number;
}

export interface TrailerSpecifications {
  minLength: number;
  maxLength: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  minCapacity: number;
  maxCapacity: number;
  averagePrice: number;
}

export interface AccessoryItem {
  id: number;
  name: string;
  icon: JSX.Element;
  description: string;
  averagePrice?: number;
}

export enum TrailerCategory {
  OPEN = "open",
  CLOSED = "closed", 
  SPECIALIZED = "specialized",
  VEHICLE_TRANSPORT = "vehicle_transport",
  RECREATIONAL = "recreational",
  COMMERCIAL = "commercial"
}

// ============================================================================
// ENUM TO UI MAPPING
// ============================================================================

/**
 * Maps database enum values to user-friendly trailer type names
 */
export const ENUM_TO_UI_MAPPING: Record<string, string> = {
  OPEN: "Open aanhanger",
  CLOSED: "Gesloten aanhanger", 
  PICKUP: "Autotransporter",
  BOAT: "Boottrailer",
  MOTORCYCLE: "Motorfiets aanhanger",
  CAR: "Autotransporter",
  FURNITURE: "Meubeltransporter",
  LIVESTOCK: "Paardentrailer",
  REFRIGERATED: "Koeltrailer",
  FLATBED: "Flatbed aanhanger",
  OTHER: "Overig",
  // Legacy mappings
  OPEN_AANHANGER: "Open aanhanger",
  GESLOTEN_AANHANGER: "Gesloten aanhanger",
  AUTOTRANSPORTER: "Autotransporter",
  PAARDENTRAILER: "Paardentrailer",
  BOOTTRAILER: "Boottrailer",
  KIPPER: "Kipper",
  MOTORFIETS_AANHANGER: "Motorfiets aanhanger",
  FLATBED_AANHANGER: "Flatbed aanhanger",
  BAGAGE_AANHANGER: "Bagage aanhanger",
  VERKOOPWAGEN: "Verkoopwagen",
  FIETSEN_AANHANGER: "Fietsen aanhanger",
  SCHAMEL_AANHANGERS: "Schamel aanhanger",
  PLATEAUWAGENS: "Plateauwagen",
  OVERIG: "Overig",
};

/**
 * Maps user-facing trailer type names to database enum values
 */
export const UI_TO_ENUM_MAPPING: Record<string, string> = {
  "Open aanhanger": "OPEN",
  "Gesloten aanhanger": "CLOSED",
  "Autotransporter": "PICKUP",
  "Boottrailer": "BOAT", 
  "Motorfiets aanhanger": "MOTORCYCLE",
  "Meubeltransporter": "FURNITURE",
  "Paardentrailer": "LIVESTOCK",
  "Koeltrailer": "REFRIGERATED",
  "Flatbed aanhanger": "FLATBED",
  "Overig": "OTHER",
  // Legacy support
  "Plateauwagen enkelasser": "OPEN",
  "Plateauwagen dubbelasser": "OPEN",
  "Ongeremd enkelasser": "OPEN",
  "Ongeremd dubbelasser": "OPEN",
  "Schamel aanhanger": "FLATBED",
  "Kipper enkelasser": "OPEN",
  "Kipper dubbelasser": "OPEN", 
  "Transporter enkelasser": "PICKUP",
  "Transporter dubbelasser": "PICKUP",
  "Gesloten enkelasser": "CLOSED",
  "Gesloten dubbelasser": "CLOSED",
  "Boot aanhanger": "BOAT",
  "Auto aanhanger": "PICKUP",
  "Bagage aanhanger": "CLOSED",
  "Verkoopwagen": "OTHER",
  "Fietsen aanhanger": "MOTORCYCLE",
  "Plateauwagen": "OPEN",
  "Kipper": "OPEN",
};

// ============================================================================
// COMPREHENSIVE TRAILER TYPE DATA
// ============================================================================

export const TRAILER_TYPE_DATA: Record<string, TrailerTypeDetails> = {
  OPEN: {
    icon: <UnbrakedTrailer size={24} strokeWidth="1.5" />,
    name: "Open aanhanger",
    category: TrailerCategory.OPEN,
    averagePrice: 35,
    description: (
      <>
        <p className="mb-4">
          Open aanhangers beschikken over een open laadvloer zonder zij- of
          achterwanden. Dit maakt ze bijzonder veelzijdig voor het vervoeren
          van grote, onregelmatige of zware ladingen zoals tuinmaterialen,
          bouwafval of meubels. Ze zijn ideaal voor korte transporten in
          binnenstedelijke omgevingen, maar vereisen extra aandacht voor het
          vastzetten van de lading.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Open laadbak</strong>: ideaal voor grote en onregelmatig gevormde voorwerpen</li>
          <li><strong>Weersinvloeden</strong>: lading is blootgesteld aan regen en wind</li>
          <li><strong>Veiligheid</strong>: controleer bandenspanning en verlichting regelmatig</li>
          <li><strong>Rijbewijs</strong>: meestal volstaat rijbewijs B</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Let op de maximaal toegestane massa (MTM)</li>
          <li>Verdeel het gewicht gelijkmatig en let op correcte kogeldruk</li>
          <li>Houd extra afstand tijdens het rijden</li>
        </ul>
      </>
    ),
    features: [
      "Neerklapbare zijwanden voor eenvoudig laden",
      "Multifunctioneel inzetbaar", 
      "Gebruik een afdekzeil bij slecht weer"
    ],
    specifications: {
      minLength: 150,
      maxLength: 450,
      minWidth: 80,
      maxWidth: 250,
      minHeight: 0,
      maxHeight: 1000,
      minWeight: 100,
      maxWeight: 600,
      minCapacity: 150,
      maxCapacity: 1400,
      averagePrice: 35,
    }
  },

  CLOSED: {
    icon: <ClosedTrailer size={24} strokeWidth="1.5" />,
    name: "Gesloten aanhanger",
    category: TrailerCategory.CLOSED,
    averagePrice: 60,
    description: (
      <>
        <p className="mb-4">
          Gesloten aanhangers bieden een volledig afgeschermd laadcompartiment
          dat optimale bescherming biedt tegen weersinvloeden en ongewenste
          inkijk. Ze zijn zeer geschikt voor het vervoer van waardevolle,
          kwetsbare of breekbare ladingen zoals elektronica en meubels.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Bescherming</strong>: dichte opbouw voorkomt schade door weer en wind</li>
          <li><strong>Veilig afsluitbaar</strong>: vaak voorzien van sloten</li>
          <li><strong>Ventilatie</strong>: controleer ventilatie om vocht te voorkomen</li>
          <li><strong>Hoogte</strong>: let op hoogtebeperkingen bij parkeergarages</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Controleer afdichtingen en sluitwerk regelmatig</li>
          <li>Zorg voor gelijkmatige gewichtsverdeling</li>
          <li>Houd rekening met langere remweg bij volledige belading</li>
        </ul>
      </>
    ),
    features: [
      "Waterdichte afdichting en afsluitbare deuren",
      "Ideaal voor waardevolle en breekbare ladingen",
      "Bescherming tegen weersinvloeden"
    ],
    specifications: {
      minLength: 200,
      maxLength: 700,
      minWidth: 90,
      maxWidth: 320,
      minHeight: 100,
      maxHeight: 350,
      minWeight: 150,
      maxWeight: 1200,
      minCapacity: 300,
      maxCapacity: 2400,
      averagePrice: 60,
    }
  },

  PICKUP: {
    icon: <TransportTrailer size={24} strokeWidth="1.5" />,
    name: "Autotransporter",
    category: TrailerCategory.VEHICLE_TRANSPORT,
    averagePrice: 100,
    description: (
      <>
        <p className="mb-4">
          Pickup-aanhangers zijn speciaal ontworpen voor het vervoeren van
          voertuigen en zware ladingen. Met geïntegreerde oprijplaten en
          verstelbare wielstops zorgen ze voor een veilige, stabiele lading.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Oprijplaten</strong>: eenvoudig opladen van rollende lading</li>
          <li><strong>Verstelbare wielstops</strong>: voorkomt verschuiven</li>
          <li><strong>Gewichtsverdeling</strong>: verdeel gelijkmatig over assen</li>
          <li><strong>Remsysteem</strong>: geremde uitvoering bij zware lading</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Controleer bevestigingspunten voor vertrek</li>
          <li>Let op juiste kogeldruk</li>
          <li>Langere remafstand en bochtenradius</li>
        </ul>
      </>
    ),
    features: [
      "Verstelbare wielstops en stevige oprijplaten",
      "Robuuste constructie voor veilig transport",
      "Geschikt voor diverse voertuigtypes"
    ],
    specifications: {
      minLength: 300,
      maxLength: 700,
      minWidth: 150,
      maxWidth: 320,
      minHeight: 0,
      maxHeight: 1000,
      minWeight: 400,
      maxWeight: 1900,
      minCapacity: 700,
      maxCapacity: 3800,
      averagePrice: 100,
    }
  },

  BOAT: {
    icon: <BoatTrailerDouble size={28} strokeWidth="1.5" />,
    name: "Boottrailer",
    category: TrailerCategory.SPECIALIZED,
    averagePrice: 70,
    description: (
      <>
        <p className="mb-4">
          Bootaanhangers zijn ontworpen voor het veilig en gemakkelijk
          vervoeren van boten. Met een kantelbare constructie, verstelbare
          steunpunten en een geïntegreerde lier is het laden en lossen bij een
          helling eenvoudig.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Kantelbaar frame</strong>: vergemakkelijkt te water laten</li>
          <li><strong>Verstelbare steunen</strong>: past verschillende bootvormen</li>
          <li><strong>Geïntegreerde lier</strong>: eenvoudig op- en afhalen</li>
          <li><strong>Corrosiebestendig</strong>: spoel af na zout water</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Check bootafmetingen en gewicht binnen limieten</li>
          <li>Controleer lierkabel, assen en verlichting</li>
          <li>Verdeel gewicht in boot voor stabiliteit</li>
        </ul>
      </>
    ),
    features: [
      "Kantelbare constructie en geïntegreerde lier",
      "Corrosiebestendig materiaal",
      "Verstelbare steunpunten voor verschillende boten"
    ],
    specifications: {
      minLength: 280,
      maxLength: 1000,
      minWidth: 90,
      maxWidth: 320,
      minHeight: 0,
      maxHeight: 1000,
      minWeight: 140,
      maxWeight: 1200,
      minCapacity: 300,
      maxCapacity: 4000,
      averagePrice: 70,
    }
  },

  MOTORCYCLE: {
    icon: <BicycleTrailer size={24} strokeWidth="1.5" />,
    name: "Motorfiets aanhanger",
    category: TrailerCategory.VEHICLE_TRANSPORT,
    averagePrice: 40,
    description: (
      <>
        <p className="mb-4">
          Motorfietsaanhangers zijn compact en ontworpen om motorfietsen of
          scooters veilig te kunnen vervoeren. Met geïntegreerde wielklemmen,
          een antislip vloer en een laag zwaartepunt worden schokken tot een
          minimum beperkt.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Wielklemmen</strong>: fixeer het voorwiel voor stabiliteit</li>
          <li><strong>Antislip vloer</strong>: voorkomt wegglijden bij vocht</li>
          <li><strong>Laag zwaartepunt</strong>: zorgt voor stabiel rijgedrag</li>
          <li><strong>Spanbanden</strong>: gebruik stevige banden voor fixatie</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Controleer of motor stevig en recht staat</li>
          <li>Voorkom beweging bij hobbels</li>
          <li>Langere remweg en bredere bochten</li>
        </ul>
      </>
    ),
    features: [
      "Integrale wielklemmen en antislip vloer",
      "Laag zwaartepunt voor stabiliteit",
      "Geschikt voor motorfietsen en scooters"
    ],
    specifications: {
      minLength: 120,
      maxLength: 450,
      minWidth: 50,
      maxWidth: 340,
      minHeight: 0,
      maxHeight: 1000,
      minWeight: 50,
      maxWeight: 500,
      minCapacity: 100,
      maxCapacity: 1000,
      averagePrice: 40,
    }
  },

  CAR: {
    icon: <CarTrailer size={24} strokeWidth="1.5" />,
    name: "Autotransporter",
    category: TrailerCategory.VEHICLE_TRANSPORT,
    averagePrice: 100,
    description: (
      <>
        <p className="mb-4">
          Autotrailers zijn geavanceerd ontworpen voor het veilig en stabiel
          transporteren van personenauto's, bedrijfswagens of andere
          voertuigen. Ze zijn uitgerust met een hydraulisch kantelsysteem,
          stevige oprijplaten en meerdere bevestigingspunten.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Hydraulisch kantelbaar</strong>: vergemakkelijkt oprijden</li>
          <li><strong>Stevige oprijplaten</strong>: stabiel laden en lossen</li>
          <li><strong>Vastzetten</strong>: gebruik sjorogen en spanbanden</li>
          <li><strong>Systemen</strong>: controleer hydrauliek en remmen</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Let op totaalgewicht en maximaal toegestane massa</li>
          <li>Verdeel last voor juiste kogeldruk</li>
          <li>Voorzichtig rijden, vooral bij afdalingen</li>
        </ul>
      </>
    ),
    features: [
      "Hydraulisch kantel-systeem",
      "Meerdere bevestigingspunten",
      "Stevige oprijplaten voor veilig laden"
    ],
    specifications: {
      minLength: 300,
      maxLength: 700,
      minWidth: 150,
      maxWidth: 320,
      minHeight: 0,
      maxHeight: 1000,
      minWeight: 400,
      maxWeight: 1900,
      minCapacity: 700,
      maxCapacity: 3800,
      averagePrice: 100,
    }
  },

  FURNITURE: {
    icon: <FlatTrailerClosed size={24} strokeWidth="1.5" />,
    name: "Meubeltransporter",
    category: TrailerCategory.SPECIALIZED,
    averagePrice: 55,
    description: (
      <>
        <p className="mb-4">
          Meubeltransportaanhangers bieden een ruim laadoppervlak dat speciaal
          is ingericht voor het veilig vervoeren van grote en zware
          meubelstukken. De interne bevestigingspunten zorgen voor extra
          bescherming tijdens transport.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Ruim laadvolume</strong>: ideaal voor kasten, banken en bedden</li>
          <li><strong>Bevestigingsrails</strong>: spanbanden voorkomen verschuiven</li>
          <li><strong>Bescherming</strong>: gebruik dekens en noppenfolie</li>
          <li><strong>Laadklep</strong>: check hoogte van laadvloer</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Gelijkmatige gewichtsverdeling en kogeldruk</li>
          <li>Let op extra hoogte of lengte</li>
          <li>Controleer spanbanden en bevestigingsogen</li>
        </ul>
      </>
    ),
    features: [
      "Ruim laadoppervlak en interne bevestigingspunten",
      "Flexibele inrichting voor diverse meubelstukken",
      "Extra bescherming voor kwetsbare lading"
    ],
    specifications: {
      minLength: 200,
      maxLength: 600,
      minWidth: 100,
      maxWidth: 300,
      minHeight: 100,
      maxHeight: 300,
      minWeight: 200,
      maxWeight: 1000,
      minCapacity: 400,
      maxCapacity: 2000,
      averagePrice: 55,
    }
  },

  LIVESTOCK: {
    icon: <HorseTrailer size={24} strokeWidth="1.5" />,
    name: "Paardentrailer",
    category: TrailerCategory.SPECIALIZED,
    averagePrice: 75,
    description: (
      <>
        <p className="mb-4">
          Veetrailers zijn ontworpen met het welzijn en de veiligheid van
          dieren als hoogste prioriteit. Ze beschikken over ruime stallen,
          uitstekende ventilatie en een antislip vloer voor comfort en
          veiligheid.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Ruime stallen</strong>: voldoende bewegingsruimte</li>
          <li><strong>Ventilatie</strong>: voorkom oververhitting</li>
          <li><strong>Antislip vloer</strong>: verhoogt comfort en veiligheid</li>
          <li><strong>Reiniging</strong>: onderhoud hygiëne en gezondheid</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Regelmatige pauzes bij langere ritten</li>
          <li>Controleer op beschadigingen of losse delen</li>
          <li>Veterinaire documenten bij grensoverschrijdend vervoer</li>
        </ul>
      </>
    ),
    features: [
      "Ruime stallen en goede ventilatie",
      "Antislip vloer voor stabiliteit",
      "Ontworpen voor dierenwelzijn"
    ],
    specifications: {
      minLength: 200,
      maxLength: 700,
      minWidth: 100,
      maxWidth: 350,
      minHeight: 120,
      maxHeight: 400,
      minWeight: 400,
      maxWeight: 1900,
      minCapacity: 300,
      maxCapacity: 2400,
      averagePrice: 75,
    }
  },

  REFRIGERATED: {
    icon: <ClosedTrailerDouble size={24} strokeWidth="1.5" />,
    name: "Koeltrailer",
    category: TrailerCategory.SPECIALIZED,
    averagePrice: 150,
    description: (
      <>
        <p className="mb-4">
          Refrigerated trailers (koelwagens) zijn speciaal ontwikkeld voor het
          vervoer van temperatuurgevoelige goederen zoals voedsel, medicijnen
          en bloemen. Ze beschikken over een actief koelsysteem en hoogwaardige
          isolatie.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Actief koelsysteem</strong>: constante temperatuur</li>
          <li><strong>Hoogwaardige isolatie</strong>: beperkt temperatuurverlies</li>
          <li><strong>Condensbeheer</strong>: voorkom vocht en schimmel</li>
          <li><strong>Hygiëne</strong>: grondig reinigen na gebruik</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Monitor temperatuur regelmatig tijdens transport</li>
          <li>Controleer stroomvoorziening (230V of 12V)</li>
          <li>Let op houdbaarheid en regelgeving</li>
        </ul>
      </>
    ),
    features: [
      "Actief koelsysteem en hoogwaardige isolatie",
      "Constante temperatuurbeheersing",
      "Geschikt voor temperatuurgevoelige goederen"
    ],
    specifications: {
      minLength: 250,
      maxLength: 800,
      minWidth: 150,
      maxWidth: 300,
      minHeight: 150,
      maxHeight: 300,
      minWeight: 400,
      maxWeight: 1500,
      minCapacity: 500,
      maxCapacity: 3000,
      averagePrice: 150,
    }
  },

  FLATBED: {
    icon: <PlateauTrailer size={24} strokeWidth="1.5" />,
    name: "Flatbed aanhanger",
    category: TrailerCategory.OPEN,
    averagePrice: 70,
    description: (
      <>
        <p className="mb-4">
          Flatbed-aanhangers hebben een volledig open en vlak laadoppervlak,
          waardoor ze bij uitstek geschikt zijn voor het vervoeren van lange,
          zware of onregelmatige goederen zoals bouwmaterialen, buizen of hout.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Volledig vlakke laadvloer</strong>: veel bewegingsruimte</li>
          <li><strong>Weinig beperkingen</strong>: voor uitstekende ladingen</li>
          <li><strong>Geen zijwanden</strong>: gebruik spanbanden en kettingen</li>
          <li><strong>Laadgemak</strong>: heftrucks kunnen eenvoudig laden</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Verdeel gewicht gelijkmatig en let op draagkracht</li>
          <li>Check bevestiging regelmatig tijdens ritten</li>
          <li>Let op windgevoeligheid door vlakke lading</li>
        </ul>
      </>
    ),
    features: [
      "Volledig open en vlak laadoppervlak",
      "Maximale flexibiliteit in het laden",
      "Geschikt voor lange en zware objecten"
    ],
    specifications: {
      minLength: 250,
      maxLength: 1000,
      minWidth: 80,
      maxWidth: 420,
      minHeight: 0,
      maxHeight: 1000,
      minWeight: 200,
      maxWeight: 2000,
      minCapacity: 500,
      maxCapacity: 4500,
      averagePrice: 70,
    }
  },

  OTHER: {
    icon: <Hitch size={24} strokeWidth="1.5" />,
    name: "Overig",
    category: TrailerCategory.SPECIALIZED,
    averagePrice: 0,
    description: (
      <>
        <p className="mb-4">
          Speciale of op maat gemaakte aanhangers vallen buiten de
          standaardcategorieën en zijn ontworpen voor unieke transportbehoeften.
          Ze kunnen beschikken over specifieke bevestigingssystemen en extra
          voorzieningen.
        </p>
        <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
        <ul className="list-disc ml-5 space-y-1 mb-4">
          <li><strong>Maatwerk</strong>: elk exemplaar kan sterk verschillen</li>
          <li><strong>Specifieke uitrusting</strong>: gereedschapskisten, hydrauliek</li>
          <li><strong>Gewichtsverdeling</strong>: kan afwijkend zijn</li>
          <li><strong>Veiligheid</strong>: vraag eigenaar om instructies</li>
        </ul>
        <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Controleer speciale voorzieningen en werking</li>
          <li>Zorg voor goede verzekering en vergunningen</li>
          <li>Test eerst leeg of licht beladen</li>
        </ul>
      </>
    ),
    features: [
      "Specifieke bevestigingssystemen en maatwerk",
      "Extra voorzieningen voor unieke transportbehoeften",
      "Raadpleeg eigenaar voor specifieke kenmerken"
    ],
    specifications: {
      minLength: 0,
      maxLength: 10000,
      minWidth: 0,
      maxWidth: 10000,
      minHeight: 0,
      maxHeight: 10000,
      minWeight: 0,
      maxWeight: 10000,
      minCapacity: 0,
      maxCapacity: 10000,
      averagePrice: 0,
    }
  },
};

// ============================================================================
// ACCESSORY DATA
// ============================================================================

export const ACCESSORY_DATA: AccessoryItem[] = [
  {
    id: 1,
    name: "Disselslot",
    icon: <Lock size={20} strokeWidth={1.5} />,
    description: "Een slot dat op de dissel wordt geplaatst om diefstal te voorkomen.",
    averagePrice: 25,
  },
  {
    id: 2,
    name: "Oprijplaten",
    icon: <Ramps size={20} strokeWidth={1.5} />,
    description: "Platen om de aanhanger op te rijden voor gemakkelijker laden en lossen.",
    averagePrice: 35,
  },
  {
    id: 3,
    name: "7 naar 13 polige adapter",
    icon: <PlugRight size={20} />,
    description: "Adapter voor aansluiting van 7-polige stekker op 13-polige aansluiting.",
    averagePrice: 15,
  },
  {
    id: 4,
    name: "13 naar 7 polige adapter", 
    icon: <PlugLeft size={20} strokeWidth={1.5} />,
    description: "Adapter voor aansluiting van 13-polige stekker op 7-polige aansluiting.",
    averagePrice: 15,
  },
  {
    id: 5,
    name: "Afdek zeil",
    icon: <Frame size={20} strokeWidth={1.5} />,
    description: "Zeil om lading te beschermen tegen regen, wind en andere weersomstandigheden.",
    averagePrice: 20,
  },
  {
    id: 6,
    name: "Afdek net",
    icon: <Net size={20} strokeWidth={1.5} />,
    description: "Net om te voorkomen dat lading tijdens transport van de aanhanger valt.",
    averagePrice: 18,
  },
  {
    id: 7,
    name: "Pionnen",
    icon: <Pilon2 size={20} />,
    description: "Verkeerspionnen voor markering en veiligheid tijdens laden/lossen.",
    averagePrice: 12,
  },
  {
    id: 8,
    name: "Kruiwagen",
    icon: <Wheelbarrow size={20} />,
    description: "Kruiwagen voor handmatig transport van materialen.",
    averagePrice: 45,
  },
  {
    id: 9,
    name: "Lange lading bord",
    icon: <LongLoad size={20} />,
    description: "Waarschuwingsbord voor transporten met uitstekende lading.",
    averagePrice: 8,
  },
];

// ============================================================================
// LEGACY TRAILER TYPE DATA (for backwards compatibility)
// ============================================================================

export const LEGACY_TRAILER_TYPES = [
  {
    id: 1,
    trailerType: "Plateauwagen enkelasser",
    averagePrice: 25,
    maxLength: 450,
    maxWidth: 250,
    maxHeight: 150,
    maxWeight: 750,
    maxCapacity: 1600,
    icon: <PlateauTrailer size={30} strokeWidth="1.4" />,
    description: "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
  },
  {
    id: 2,
    trailerType: "Plateauwagen dubbelasser",
    averagePrice: 30,
    maxLength: 650,
    maxWidth: 300,
    maxHeight: 150,
    maxWeight: 1100,
    maxCapacity: 2600,
    icon: <PlateauTrailerDouble size={36} strokeWidth="1.6" />,
    description: "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
  },
  // ... additional legacy types can be added here
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format trailer type for display
 */
export const formatTrailerType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Get trailer type details with fallback
 */
export function getTrailerTypeDetails(
  type: TrailerType | string | null
): TrailerTypeDetails {
  if (!type) {
    return TRAILER_TYPE_DATA.OTHER;
  }

  const normalizedType = typeof type === 'string' ? type.toUpperCase() : type;
  
  // Create a mapping from database enum values to our simplified keys
  const dbToSimplifiedMapping: Record<string, string> = {
    'OPEN_AANHANGER': 'OPEN',
    'GESLOTEN_AANHANGER': 'CLOSED',
    'AUTOTRANSPORTER': 'PICKUP',
    'PAARDENTRAILER': 'LIVESTOCK',
    'BOOTTRAILER': 'BOAT',
    'KIPPER': 'OPEN', // Kipper is a type of open trailer
    'MOTORFIETS_AANHANGER': 'MOTORCYCLE',
    'FLATBED_AANHANGER': 'FLATBED',
    'BAGAGE_AANHANGER': 'FURNITURE',
    'VERKOOPWAGEN': 'OTHER',
    'FIETSEN_AANHANGER': 'MOTORCYCLE', // Bike trailers are similar to motorcycle trailers
    'SCHAMEL_AANHANGERS': 'FLATBED',
    'PLATEAUWAGENS': 'OPEN',
    'OVERIG': 'OTHER',
    // Direct mappings for simplified types
    'OPEN': 'OPEN',
    'CLOSED': 'CLOSED',
    'PICKUP': 'PICKUP',
    'BOAT': 'BOAT',
    'MOTORCYCLE': 'MOTORCYCLE',
    'CAR': 'CAR',
    'FURNITURE': 'FURNITURE',
    'LIVESTOCK': 'LIVESTOCK',
    'REFRIGERATED': 'REFRIGERATED',
    'FLATBED': 'FLATBED',
    'OTHER': 'OTHER'
  };
  
  const simplifiedType = dbToSimplifiedMapping[normalizedType] || 'OTHER';
  return TRAILER_TYPE_DATA[simplifiedType] || TRAILER_TYPE_DATA.OTHER;
}

/**
 * Generate trailer features based on properties
 */
export function generateTrailerFeatures(
  type: TrailerType | null,
  brakes?: boolean,
  capacity?: number | null,
  weight?: number | null,
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  },
  manufacturer?: string | null,
  year?: number | null
): string[] {
  const features: string[] = [];

  if (type) {
    const typeDetails = getTrailerTypeDetails(type);
    if (typeDetails.features) {
      features.push(...typeDetails.features);
    }
  }

  if (brakes) {
    features.push("Voorzien van remsysteem voor veilig transport");
  }

  if (capacity && capacity > 2) {
    features.push(`Hoge laadcapaciteit van ${capacity} ton`);
  } else if (capacity) {
    features.push(`Laadcapaciteit van ${capacity} ton`);
  }

  if (weight && weight < 400) {
    features.push("Lichtgewicht constructie voor eenvoudig manoeuvreren");
  }

  if (dimensions?.length && dimensions.length > 4) {
    features.push(`Extra lang laadoppervlak (${dimensions.length} m)`);
  }

  if (dimensions?.width && dimensions.width > 2) {
    features.push(`Brede laadvloer (${dimensions.width} m)`);
  }

  if (manufacturer) {
    features.push(`Kwaliteitsproduct van ${manufacturer}`);
  }

  if (year && year > 2020) {
    features.push("Recent model met moderne voorzieningen");
  } else if (year) {
    features.push(`Betrouwbaar model uit ${year}`);
  }

  return features;
}

/**
 * Enhanced trailer description with intro
 */
export function getEnhancedTrailerDescription(
  type: TrailerType | null,
  manufacturer?: string | null,
  year?: number | null,
  customDescription?: ReactNode | null
): ReactNode {
  if (customDescription) {
    return customDescription;
  }

  const typeDetails = getTrailerTypeDetails(type);
  const baseDescription = typeDetails.description;

  let intro: ReactNode = null;
  if (manufacturer || year) {
    const formattedType = type
      ? formatTrailerType(type).toLowerCase()
      : "aanhanger";

    let introText = "Deze ";
    if (manufacturer) introText += `${manufacturer} `;
    introText += formattedType;
    if (year) introText += ` uit ${year}`;

    intro = <p className="mb-4 font-semibold">{introText}</p>;
  }

  return (
    <>
      <h4 className="font-semibold mb-4 text-lg text-[#222222]">Beschrijving</h4>
      {intro}
      {baseDescription}
    </>
  );
}

/**
 * Maps database enum values to user-friendly names
 */
export function mapEnumToTrailerType(enumValue: string): string {
  return ENUM_TO_UI_MAPPING[enumValue] || "Overig";
}

/**
 * Maps user-friendly names to database enum values
 */
export function mapTrailerTypeToEnum(uiTrailerType: string): string {
  return UI_TO_ENUM_MAPPING[uiTrailerType] || "OTHER";
}

/**
 * Get all trailer types for selection
 */
export function getAllTrailerTypes(iconSize = 24): Array<{
  id: string;
  name: string;
  icon: JSX.Element;
  category: TrailerCategory;
  averagePrice: number;
  specifications: TrailerSpecifications;
}> {
  return Object.entries(TRAILER_TYPE_DATA).map(([key, data]) => ({
    id: key,
    name: data.name,
    icon: data.icon,
    category: data.category,
    averagePrice: data.averagePrice,
    specifications: data.specifications,
  }));
}

/**
 * Get trailer types by category
 */
export function getTrailerTypesByCategory(category: TrailerCategory) {
  return Object.entries(TRAILER_TYPE_DATA)
    .filter(([_, data]) => data.category === category)
    .map(([key, data]) => ({ id: key, ...data }));
}

/**
 * Get trailer icon with standardized styling
 */
export function getTrailerIcon(
  type: TrailerType | string | null,
  size = 24,
  strokeWidth = "1.5"
): JSX.Element {
  const typeDetails = getTrailerTypeDetails(type);
  return typeDetails.icon;
}

/**
 * Validate trailer specifications
 */
export function validateTrailerSpecs(
  type: TrailerType | string | null,
  length: number,
  width: number,
  weight: number,
  capacity: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const typeDetails = getTrailerTypeDetails(type);
  const specs = typeDetails.specifications;

  if (length < specs.minLength || length > specs.maxLength) {
    errors.push(`Lengte moet tussen ${specs.minLength} en ${specs.maxLength} cm zijn`);
  }

  if (width < specs.minWidth || width > specs.maxWidth) {
    errors.push(`Breedte moet tussen ${specs.minWidth} en ${specs.maxWidth} cm zijn`);
  }

  if (weight < specs.minWeight || weight > specs.maxWeight) {
    errors.push(`Gewicht moet tussen ${specs.minWeight} en ${specs.maxWeight} kg zijn`);
  }

  if (capacity < specs.minCapacity || capacity > specs.maxCapacity) {
    errors.push(`Capaciteit moet tussen ${specs.minCapacity} en ${specs.maxCapacity} kg zijn`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}