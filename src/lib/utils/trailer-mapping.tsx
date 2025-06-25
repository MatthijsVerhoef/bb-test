/**
 * Comprehensive trailer type mapping utility
 * This utility maps trailer types to their corresponding details including icons, names,
 * descriptions, and specifications.
 *
 * It also provides helper functions for formatting trailer types and extracting specifications.
 */

import {
  PlateauTrailer,
  PlateauTrailerDouble,
  UnbrakedTrailer,
  UnbrakedTrailerDouble,
  BagageTrailer,
  DrawBarTrailer,
  TipperTrailer,
  TipperTrailerDouble,
  TransportTrailer,
  TransportTrailerDouble,
  ClosedTrailer,
  ClosedTrailerDouble,
  BicycleTrailer,
  BicycleTrailerDouble,
  HorseTrailer,
  BoatTrailerDouble,
  CarTrailer,
  FlatTrailer,
  FlatTrailerClosed,
  FlatTrailerClosedDouble,
  FoodTrailer,
  Hitch,
  BikeTrailer,
  CampingTrailer,
} from "@/lib/icons/trailer-icons";
import { TruckIcon } from "lucide-react";

/**
 * Maps a trailer type to its corresponding details
 * @param {string|number|object} trailerType - The type of trailer
 * @param {number} [size=24] - The size of the icon
 * @param {string} [strokeWidth="1.5"] - The stroke width of the icon
 * @returns {Object} The trailer details including icon, name, description, and specifications
 */
export function getTrailerTypeDetails(
  trailerType,
  size = 24,
  strokeWidth = "1.5"
) {
  // Default return value if no match is found
  const defaultDetails = {
    icon: <TruckIcon size={size} strokeWidth={strokeWidth} />,
    name: "Onbekend type",
    description: "Details voor dit type aanhanger zijn niet beschikbaar.",
    specifications: {},
  };

  // If no trailer type is provided, return default
  if (!trailerType) {
    return defaultDetails;
  }

  // Normalize the trailer type for case-insensitive matching
  const normalizedType =
    typeof trailerType === "string"
      ? trailerType.toLowerCase()
      : trailerType.toString();

  // Map of trailer types to their details
  const trailerTypeMap = {
    // Plateau trailers
    "plateauwagen enkelasser": {
      icon: <PlateauTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Plateauwagen enkelasser",
      description:
        "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 25,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 150,
        maxWeight: 750,
        maxCapacity: 1600,
      },
    },
    "plateauwagen dubbelasser": {
      icon: <PlateauTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Plateauwagen dubbelasser",
      description:
        "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 30,
        maxLength: 650,
        maxWidth: 300,
        maxHeight: 150,
        maxWeight: 1100,
        maxCapacity: 2600,
      },
    },
    plateau_enkelasser: {
      icon: <PlateauTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Plateauwagen enkelasser",
      description:
        "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 25,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 150,
        maxWeight: 750,
        maxCapacity: 1600,
      },
    },
    plateau_dubbelasser: {
      icon: <PlateauTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Plateauwagen dubbelasser",
      description:
        "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 30,
        maxLength: 650,
        maxWidth: 300,
        maxHeight: 150,
        maxWeight: 1100,
        maxCapacity: 2600,
      },
    },
    // Unbraked trailers
    "ongeremd enkelasser": {
      icon: <UnbrakedTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Ongeremd enkelasser",
      description:
        "Deze aanhangwagens zijn vaak kleiner omdat het totaalgewicht niet boven de 750 kg mag uitkomen. Meestal mogen deze aanhangwagens zonder een E rijbewijs getrokken worden. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 25,
        maxLength: 350,
        maxWidth: 200,
        maxHeight: 150,
        maxWeight: 450,
        maxCapacity: 800,
      },
    },
    "ongeremd dubbelasser": {
      icon: <UnbrakedTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Ongeremd dubbelasser",
      description:
        "Deze aanhangwagens zijn vaak kleiner omdat het totaalgewicht niet boven de 750 kg mag uitkomen. Meestal mogen deze aanhangwagens zonder een E rijbewijs getrokken worden. Een enkele as betekent dat de aanhanger 2 wielen bedraagt. Een dubbele as betekend dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 30,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 150,
        maxWeight: 800,
        maxCapacity: 1350,
      },
    },
    unbraked_enkelasser: {
      icon: <UnbrakedTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Ongeremd enkelasser",
      description:
        "Deze aanhangwagens zijn vaak kleiner omdat het totaalgewicht niet boven de 750 kg mag uitkomen. Meestal mogen deze aanhangwagens zonder een E rijbewijs getrokken worden. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 25,
        maxLength: 350,
        maxWidth: 200,
        maxHeight: 150,
        maxWeight: 450,
        maxCapacity: 800,
      },
    },
    unbraked_dubbelasser: {
      icon: <UnbrakedTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Ongeremd dubbelasser",
      description:
        "Deze aanhangwagens zijn vaak kleiner omdat het totaalgewicht niet boven de 750 kg mag uitkomen. Meestal mogen deze aanhangwagens zonder een E rijbewijs getrokken worden. Een enkele as betekent dat de aanhanger 2 wielen bedraagt. Een dubbele as betekend dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 30,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 150,
        maxWeight: 800,
        maxCapacity: 1350,
      },
    },
    // Bagage trailer
    "bagage aanhanger": {
      icon: <BagageTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Bagage aanhanger",
      description:
        "De bagage aanhanger is een kleine aanhanger met als voornaamste doeleinde kamperen of andere recreatieve activiteiten.",
      specifications: {
        averagePrice: 30,
        maxLength: 250,
        maxWidth: 200,
        maxHeight: 170,
        maxWeight: 400,
        maxCapacity: 600,
      },
    },
    bagage: {
      icon: <BagageTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Bagage aanhanger",
      description:
        "De bagage aanhanger is een kleine aanhanger met als voornaamste doeleinde kamperen of andere recreatieve activiteiten.",
      specifications: {
        averagePrice: 30,
        maxLength: 250,
        maxWidth: 200,
        maxHeight: 170,
        maxWeight: 400,
        maxCapacity: 600,
      },
    },
    // Schamel trailer
    "schamel aanhanger": {
      icon: <DrawBarTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Schamel aanhanger",
      description:
        "Deze aanhangwagens zijn voorzien van een draaibare vooras. Dit heeft als voordeel dat de wagen stabieler achter het trekkend voertuig aanloopt. Dit soort aanhangwagens zijn vaak langer dan de gewone wagens, maar ook een korte uitvoering is beschikbaar",
      specifications: {
        averagePrice: 75,
        maxLength: 850,
        maxWidth: 300,
        maxHeight: 150,
        maxWeight: 2200,
        maxCapacity: 3800,
      },
    },
    schamel: {
      icon: <DrawBarTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Schamel aanhanger",
      description:
        "Deze aanhangwagens zijn voorzien van een draaibare vooras. Dit heeft als voordeel dat de wagen stabieler achter het trekkend voertuig aanloopt. Dit soort aanhangwagens zijn vaak langer dan de gewone wagens, maar ook een korte uitvoering is beschikbaar",
      specifications: {
        averagePrice: 75,
        maxLength: 850,
        maxWidth: 300,
        maxHeight: 150,
        maxWeight: 2200,
        maxCapacity: 3800,
      },
    },
    // Kipper trailers
    "kipper enkelasser": {
      icon: <TipperTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Kipper enkelasser",
      description:
        "Kippers zijn aanhangers waarbij de bak omhooog geschoven kan worden waardoor lossen makkelijk kan worden uitgevoerd. Kippers in vele maten en gewichten leverbaar. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 55,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 150,
        maxWeight: 900,
        maxCapacity: 1600,
      },
    },
    "kipper dubbelasser": {
      icon: <TipperTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Kipper dubbelasser",
      description:
        "Kippers zijn aanhangers waarbij de bak omhooog geschoven kan worden waardoor lossen makkelijk kan worden uitgevoerd. Kippers in vele maten en gewichten leverbaar. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 60,
        maxLength: 650,
        maxWidth: 300,
        maxHeight: 150,
        maxWeight: 1300,
        maxCapacity: 3300,
      },
    },
    kipper_enkelasser: {
      icon: <TipperTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Kipper enkelasser",
      description:
        "Kippers zijn aanhangers waarbij de bak omhooog geschoven kan worden waardoor lossen makkelijk kan worden uitgevoerd. Kippers in vele maten en gewichten leverbaar. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 55,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 150,
        maxWeight: 900,
        maxCapacity: 1600,
      },
    },
    kipper_dubbelasser: {
      icon: <TipperTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Kipper dubbelasser",
      description:
        "Kippers zijn aanhangers waarbij de bak omhooog geschoven kan worden waardoor lossen makkelijk kan worden uitgevoerd. Kippers in vele maten en gewichten leverbaar. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 60,
        maxLength: 650,
        maxWidth: 300,
        maxHeight: 150,
        maxWeight: 1300,
        maxCapacity: 3300,
      },
    },
    // Transport trailers
    "transporter enkelasser": {
      icon: <TransportTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Transporter enkelasser",
      description:
        "Autotransporters zijn er in vele verschillende uitvoeringen. Dit kan zijn een kleine enkelas aanhangwagen voor bijvoorbeeld het vervoeren van een brommobiel of een smart, tot het vervoeren van 2 auto's op een aanhangwagen.",
      specifications: {
        averagePrice: 55,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 300,
        maxWeight: 800,
        maxCapacity: 1600,
      },
    },
    "transporter dubbelasser": {
      icon: <TransportTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Transporter dubbelasser",
      description:
        "Autotransporters zijn er in vele verschillende uitvoeringen. Dit kan zijn een kleine enkelas aanhangwagen voor bijvoorbeeld het vervoeren van een brommobiel of een smart, tot het vervoeren van 2 auto's op een aanhangwagen.",
      specifications: {
        averagePrice: 65,
        maxLength: 650,
        maxWidth: 300,
        maxHeight: 300,
        maxWeight: 1350,
        maxCapacity: 3300,
      },
    },
    transporter_enkelasser: {
      icon: <TransportTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Transporter enkelasser",
      description:
        "Autotransporters zijn er in vele verschillende uitvoeringen. Dit kan zijn een kleine enkelas aanhangwagen voor bijvoorbeeld het vervoeren van een brommobiel of een smart, tot het vervoeren van 2 auto's op een aanhangwagen.",
      specifications: {
        averagePrice: 55,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 300,
        maxWeight: 800,
        maxCapacity: 1600,
      },
    },
    transporter_dubbelasser: {
      icon: <TransportTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Transporter dubbelasser",
      description:
        "Autotransporters zijn er in vele verschillende uitvoeringen. Dit kan zijn een kleine enkelas aanhangwagen voor bijvoorbeeld het vervoeren van een brommobiel of een smart, tot het vervoeren van 2 auto's op een aanhangwagen.",
      specifications: {
        averagePrice: 65,
        maxLength: 650,
        maxWidth: 300,
        maxHeight: 300,
        maxWeight: 1350,
        maxCapacity: 3300,
      },
    },
    // Closed trailers
    "gesloten enkelasser": {
      icon: <ClosedTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Gesloten enkelasser",
      description:
        "Gesloten aanhangers zijn worden gebruikt als de lading droog moet blijven en of afgeschermd moet zijn van de buitenwereld. De panelen zijn zodanig geplaatst en afgewerkt in de aluminium profielen dat er geen water in de aanhanger komt. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 45,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 320,
        maxWeight: 800,
        maxCapacity: 1600,
      },
    },
    "gesloten dubbelasser": {
      icon: <ClosedTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Gesloten dubbelasser",
      description:
        "Gesloten aanhangers zijn worden gebruikt als de lading droog moet blijven en of afgeschermd moet zijn van de buitenwereld. De panelen zijn zodanig geplaatst en afgewerkt in de aluminium profielen dat er geen water in de aanhanger komt. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 50,
        maxLength: 680,
        maxWidth: 320,
        maxHeight: 320,
        maxWeight: 1350,
        maxCapacity: 3200,
      },
    },
    closed_enkelasser: {
      icon: <ClosedTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Gesloten enkelasser",
      description:
        "Gesloten aanhangers zijn worden gebruikt als de lading droog moet blijven en of afgeschermd moet zijn van de buitenwereld. De panelen zijn zodanig geplaatst en afgewerkt in de aluminium profielen dat er geen water in de aanhanger komt. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
      specifications: {
        averagePrice: 45,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 320,
        maxWeight: 800,
        maxCapacity: 1600,
      },
    },
    closed_dubbelasser: {
      icon: <ClosedTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Gesloten dubbelasser",
      description:
        "Gesloten aanhangers zijn worden gebruikt als de lading droog moet blijven en of afgeschermd moet zijn van de buitenwereld. De panelen zijn zodanig geplaatst en afgewerkt in de aluminium profielen dat er geen water in de aanhanger komt. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
      specifications: {
        averagePrice: 50,
        maxLength: 680,
        maxWidth: 320,
        maxHeight: 320,
        maxWeight: 1350,
        maxCapacity: 3200,
      },
    },
    // Bicycle trailer
    "fietsen aanhanger": {
      icon: <BicycleTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Fietsen aanhanger",
      description:
        "Een fiestenaanhanger wordt over het algemeen gebruikt voor het vervoeren van Elektrische fietsen. De elektrische fiets is veelal te zwaar voor een fietsendragen op de trekhaak",
      specifications: {
        averagePrice: 25,
        maxLength: 250,
        maxWidth: 190,
        maxHeight: 150,
        maxWeight: 160,
        maxCapacity: 280,
      },
    },
    fietsen_aanhanger: {
      icon: <BicycleTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Fietsen aanhanger",
      description:
        "Een fiestenaanhanger wordt over het algemeen gebruikt voor het vervoeren van Elektrische fietsen. De elektrische fiets is veelal te zwaar voor een fietsendragen op de trekhaak",
      specifications: {
        averagePrice: 25,
        maxLength: 250,
        maxWidth: 190,
        maxHeight: 150,
        maxWeight: 160,
        maxCapacity: 280,
      },
    },
    // Horse trailer
    paardentrailer: {
      icon: <HorseTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Paardentrailer",
      description:
        "Een paardentrailer is een vervoermiddel bedoeld voor het vervoeren van paarden. Een paardentrailer wordt gebruikt om paarden van een locatie naar de andere te verplaatsen. Paardentrailers zijn beschikbaar is verschillende maten.",
      specifications: {
        averagePrice: 38,
        maxLength: 600,
        maxWidth: 310,
        maxHeight: 340,
        maxWeight: 1700,
        maxCapacity: 2400,
      },
    },
    paarden_trailer: {
      icon: <HorseTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Paardentrailer",
      description:
        "Een paardentrailer is een vervoermiddel bedoeld voor het vervoeren van paarden. Een paardentrailer wordt gebruikt om paarden van een locatie naar de andere te verplaatsen. Paardentrailers zijn beschikbaar is verschillende maten.",
      specifications: {
        averagePrice: 38,
        maxLength: 600,
        maxWidth: 310,
        maxHeight: 340,
        maxWeight: 1700,
        maxCapacity: 2400,
      },
    },
    // Boat trailer
    "boot aanhanger": {
      icon: <BoatTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Boot aanhanger",
      description:
        "Een boottrailer is een aanhangwagen die speciaal is ontworpen om boten van en naar het water te transporteren. Het wordt gebruikt om de boot vanaf het land naar het water te rijden en vice versa. Boottrailers zijn verkrijgbaar in verschillende maten en modellen, afhankelijk van het gewicht en de grootte van de boot die wordt getransporteerd.",
      specifications: {
        averagePrice: 35,
        maxLength: 780,
        maxWidth: 320,
        maxHeight: 150,
        maxWeight: 900,
        maxCapacity: 2400,
      },
    },
    boot_aanhanger: {
      icon: <BoatTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Boot aanhanger",
      description:
        "Een boottrailer is een aanhangwagen die speciaal is ontworpen om boten van en naar het water te transporteren. Het wordt gebruikt om de boot vanaf het land naar het water te rijden en vice versa. Boottrailers zijn verkrijgbaar in verschillende maten en modellen, afhankelijk van het gewicht en de grootte van de boot die wordt getransporteerd.",
      specifications: {
        averagePrice: 35,
        maxLength: 780,
        maxWidth: 320,
        maxHeight: 150,
        maxWeight: 900,
        maxCapacity: 2400,
      },
    },
    // Car trailer
    "auto aanhanger": {
      icon: <CarTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Auto aanhanger",
      description:
        "Een autotrailer is speciaal ontworpen voor het vervoeren van voertuigen. Deze aanhangers zijn uitgerust met oprijplaten en bevestigingspunten om het laden en vastzetten van auto's te vergemakkelijken.",
      specifications: {
        averagePrice: 35,
        maxLength: 780,
        maxWidth: 320,
        maxHeight: 150,
        maxWeight: 900,
        maxCapacity: 2400,
      },
    },
    auto_aanhanger: {
      icon: <CarTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Auto aanhanger",
      description:
        "Een autotrailer is speciaal ontworpen voor het vervoeren van voertuigen. Deze aanhangers zijn uitgerust met oprijplaten en bevestigingspunten om het laden en vastzetten van auto's te vergemakkelijken.",
      specifications: {
        averagePrice: 35,
        maxLength: 780,
        maxWidth: 320,
        maxHeight: 150,
        maxWeight: 900,
        maxCapacity: 2400,
      },
    },
    // Food trailer
    verkoopwagen: {
      icon: <FoodTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Verkoopwagen",
      description:
        "De verkoopwagen doet dubbel dienst als transportmiddel en mobiele bedrijfsruimte, ideaal voor foodtrucks of marktverkopers.",
      specifications: {
        averagePrice: 200,
        maxLength: 1000,
        maxWidth: 500,
        maxHeight: 500,
        maxWeight: 4500,
        maxCapacity: 3000,
      },
    },
    food_trailer: {
      icon: <FoodTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Verkoopwagen",
      description:
        "De verkoopwagen doet dubbel dienst als transportmiddel en mobiele bedrijfsruimte, ideaal voor foodtrucks of marktverkopers.",
      specifications: {
        averagePrice: 200,
        maxLength: 1000,
        maxWidth: 500,
        maxHeight: 500,
        maxWeight: 4500,
        maxCapacity: 3000,
      },
    },
    // Motorcycle trailer
    "motorfiets aanhanger": {
      icon: <BikeTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Motorfiets aanhanger",
      description:
        "Voor wie een motorfiets of scooter wil vervoeren, is de motorfietsaanhanger de ideale oplossing. Deze aanhangers zijn vaak voorzien van speciale haken en riemen voor veilig transport.",
      specifications: {
        averagePrice: 40,
        maxLength: 450,
        maxWidth: 340,
        maxHeight: 1000,
        maxWeight: 500,
        maxCapacity: 1000,
      },
    },
    bike_trailer: {
      icon: <BikeTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Motorfiets aanhanger",
      description:
        "Voor wie een motorfiets of scooter wil vervoeren, is de motorfietsaanhanger de ideale oplossing. Deze aanhangers zijn vaak voorzien van speciale haken en riemen voor veilig transport.",
      specifications: {
        averagePrice: 40,
        maxLength: 450,
        maxWidth: 340,
        maxHeight: 1000,
        maxWeight: 500,
        maxCapacity: 1000,
      },
    },
    // Camping trailer
    "kampeer aanhanger": {
      icon: <CampingTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Kampeer aanhanger",
      description:
        "De kampeeraanhanger is je thuis weg van huis, ideaal voor outdoor avonturen en gezinsvakanties. Deze aanhangers zijn vaak uitgerust met basisvoorzieningen zoals een bed, keuken, en soms zelfs een badkamer.",
      specifications: {
        averagePrice: 50,
        maxLength: 900,
        maxWidth: 450,
        maxHeight: 500,
        maxWeight: 1500,
        maxCapacity: 1500,
      },
    },
    camping_trailer: {
      icon: <CampingTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Kampeer aanhanger",
      description:
        "De kampeeraanhanger is je thuis weg van huis, ideaal voor outdoor avonturen en gezinsvakanties. Deze aanhangers zijn vaak uitgerust met basisvoorzieningen zoals een bed, keuken, en soms zelfs een badkamer.",
      specifications: {
        averagePrice: 50,
        maxLength: 900,
        maxWidth: 450,
        maxHeight: 500,
        maxWeight: 1500,
        maxCapacity: 1500,
      },
    },
    // Flat bed trailer
    "flatbed aanhanger": {
      icon: <FlatTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Flatbed aanhanger",
      description:
        "Als je grote, lange objecten zoals houten planken of staalconstructies moet vervoeren, kijk dan naar een flatbed aanhanger. Met zijn open structuur en een laadcapaciteit die kan oplopen tot 3.000 kg, is deze aanhanger ontzettend veelzijdig.",
      specifications: {
        averagePrice: 70,
        maxLength: 1000,
        maxWidth: 420,
        maxHeight: 1000,
        maxWeight: 2000,
        maxCapacity: 4500,
      },
    },
    flatbed_enkelasser: {
      icon: <FlatTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Flatbed enkelasser",
      description:
        "Als je grote, lange objecten zoals houten planken of staalconstructies moet vervoeren, kijk dan naar een flatbed aanhanger. Met zijn open structuur en een laadcapaciteit die kan oplopen tot 3.000 kg, is deze aanhanger ontzettend veelzijdig.",
      specifications: {
        averagePrice: 65,
        maxLength: 800,
        maxWidth: 400,
        maxHeight: 1000,
        maxWeight: 1500,
        maxCapacity: 3500,
      },
    },
    flatbed_dubbelasser: {
      icon: <FlatTrailerClosedDouble size={size} strokeWidth={strokeWidth} />,
      name: "Flatbed dubbelasser",
      description:
        "Als je grote, lange objecten zoals houten planken of staalconstructies moet vervoeren, kijk dan naar een flatbed aanhanger. Met zijn open structuur en een laadcapaciteit die kan oplopen tot 3.000 kg, is deze aanhanger ontzettend veelzijdig.",
      specifications: {
        averagePrice: 75,
        maxLength: 1000,
        maxWidth: 420,
        maxHeight: 1000,
        maxWeight: 2000,
        maxCapacity: 4500,
      },
    },
    // Generic open/closed category
    "open aanhanger": {
      icon: <TransportTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Open aanhanger",
      description:
        "De open aanhanger is een eenvoudige, maar effectieve oplossing voor diverse transportbehoeften. Zonder zij- of bovenwanden kun je makkelijk grote of ongewoon gevormde objecten laden.",
      specifications: {
        averagePrice: 35,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 1000,
        maxWeight: 600,
        maxCapacity: 1400,
      },
    },
    open_aanhanger: {
      icon: <TransportTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Open aanhanger",
      description:
        "De open aanhanger is een eenvoudige, maar effectieve oplossing voor diverse transportbehoeften. Zonder zij- of bovenwanden kun je makkelijk grote of ongewoon gevormde objecten laden.",
      specifications: {
        averagePrice: 35,
        maxLength: 450,
        maxWidth: 250,
        maxHeight: 1000,
        maxWeight: 600,
        maxCapacity: 1400,
      },
    },
    "gesloten aanhanger": {
      icon: <ClosedTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Gesloten aanhanger",
      description:
        "Als je iets meer beveiliging nodig hebt, is een gesloten aanhanger de beste keuze. Deze is perfect voor het vervoeren van elektronica, kunstwerken, meubels en andere kostbare of kwetsbare items.",
      specifications: {
        averagePrice: 60,
        maxLength: 700,
        maxWidth: 320,
        maxHeight: 350,
        maxWeight: 1200,
        maxCapacity: 2400,
      },
    },
    gesloten_aanhanger: {
      icon: <ClosedTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Gesloten aanhanger",
      description:
        "Als je iets meer beveiliging nodig hebt, is een gesloten aanhanger de beste keuze. Deze is perfect voor het vervoeren van elektronica, kunstwerken, meubels en andere kostbare of kwetsbare items.",
      specifications: {
        averagePrice: 60,
        maxLength: 700,
        maxWidth: 320,
        maxHeight: 350,
        maxWeight: 1200,
        maxCapacity: 2400,
      },
    },
    // Autotransporter (more generic term)
    autotransporter: {
      icon: <CarTrailer size={size} strokeWidth={strokeWidth} />,
      name: "Autotransporter",
      description:
        "Voor het vervoer van voertuigen is er geen betere optie dan een autotransporter. Deze aanhangers zijn speciaal ontworpen met oprijplaten en bevestigingspunten om het laden en vastzetten van voertuigen te vergemakkelijken.",
      specifications: {
        averagePrice: 100,
        maxLength: 700,
        maxWidth: 320,
        maxHeight: 1000,
        maxWeight: 1900,
        maxCapacity: 3800,
      },
    },
    // Plateauwagen (more generic term)
    plateauwagen: {
      icon: <PlateauTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Plateauwagen",
      description:
        "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat.",
      specifications: {
        averagePrice: 55,
        maxLength: 900,
        maxWidth: 500,
        maxHeight: 1000,
        maxWeight: 2500,
        maxCapacity: 4000,
      },
    },
    // Kipper (more generic term)
    kipper: {
      icon: <TipperTrailerDouble size={size} strokeWidth={strokeWidth} />,
      name: "Kipper",
      description:
        "De kipper is je beste optie als je losse materialen zoals zand, grind of aarde wilt vervoeren. Dankzij een hydraulisch kantelmechanisme is lossen een fluitje van een cent.",
      specifications: {
        averagePrice: 55,
        maxLength: 600,
        maxWidth: 350,
        maxHeight: 1000,
        maxWeight: 1500,
        maxCapacity: 2500,
      },
    },
    // Fallback option
    overig: {
      icon: <Hitch size={size} strokeWidth={strokeWidth} />,
      name: "Overig",
      description:
        "Een type aanhanger dat niet in de standaard categorieën valt.",
      specifications: {
        averagePrice: 0,
        maxLength: 10000,
        maxWidth: 10000,
        maxHeight: 10000,
        maxWeight: 10000,
        maxCapacity: 10000,
      },
    },
  };

  // Handle enum values (if trailerType is a number or enum)
  if (
    typeof trailerType === "number" ||
    (typeof trailerType === "object" && trailerType !== null)
  ) {
    // Map numeric types to string keys
    const enumMap = {
      1: "plateauwagen enkelasser",
      2: "plateauwagen dubbelasser",
      3: "ongeremd enkelasser",
      4: "ongeremd dubbelasser",
      5: "bagage aanhanger",
      6: "schamel aanhanger",
      7: "kipper enkelasser",
      8: "kipper dubbelasser",
      9: "transporter enkelasser",
      10: "transporter dubbelasser",
      11: "gesloten enkelasser",
      12: "gesloten dubbelasser",
      13: "fietsen aanhanger",
      14: "paardentrailer",
      15: "boot aanhanger",
      16: "auto aanhanger",
      17: "transporter enkelasser", // Duplicate of 9
      18: "transporter dubbelasser", // Duplicate of 10
    };

    // If it's an enum object with a value property
    const enumValue = trailerType.valueOf?.() || trailerType;
    const mappedType = enumMap[enumValue];

    if (mappedType && trailerTypeMap[mappedType]) {
      return trailerTypeMap[mappedType];
    }
  }

  // Try to find the trailer type in the map
  if (trailerTypeMap[normalizedType]) {
    return trailerTypeMap[normalizedType];
  }

  // If we couldn't find a direct match, try to find a partial match
  const keys = Object.keys(trailerTypeMap);
  for (const key of keys) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return trailerTypeMap[key];
    }
  }

  // Return default if no match found
  return defaultDetails;
}

/**
 * Formats a trailer type for display
 * @param {string|number|object} trailerType - The type of trailer
 * @returns {string} Formatted trailer type name
 */
export function formatTrailerType(trailerType) {
  const details = getTrailerTypeDetails(trailerType);
  return details.name || "Onbekend type";
}

/**
 * Gets the specifications for a trailer type
 * @param {string|number|object} trailerType - The type of trailer
 * @returns {Object} The trailer specifications
 */
export function getTrailerTypeSpecs(trailerType) {
  const details = getTrailerTypeDetails(trailerType);
  return details.specifications || {};
}

/**
 * Gets all available trailer types as an array of objects
 * @returns {Array<Object>} Array of trailer type objects with id, name, and icon
 */
export function getAllTrailerTypes(iconSize = 24) {
  // Using the ID mappings from the enum handling in getTrailerTypeDetails
  const trailerTypes = [
    { id: 1, type: "plateauwagen enkelasser" },
    { id: 2, type: "plateauwagen dubbelasser" },
    { id: 3, type: "ongeremd enkelasser" },
    { id: 4, type: "ongeremd dubbelasser" },
    { id: 5, type: "bagage aanhanger" },
    { id: 6, type: "schamel aanhanger" },
    { id: 7, type: "kipper enkelasser" },
    { id: 8, type: "kipper dubbelasser" },
    { id: 9, type: "transporter enkelasser" },
    { id: 10, type: "transporter dubbelasser" },
    { id: 11, type: "gesloten enkelasser" },
    { id: 12, type: "gesloten dubbelasser" },
    { id: 13, type: "fietsen aanhanger" },
    { id: 14, type: "paardentrailer" },
    { id: 15, type: "boot aanhanger" },
    { id: 16, type: "auto aanhanger" },
  ];

  return trailerTypes.map((item) => {
    const details = getTrailerTypeDetails(item.type, iconSize);
    return {
      id: item.id,
      name: details.name,
      type: item.type,
      icon: details.icon,
      description: details.description,
      specifications: details.specifications,
    };
  });
}
