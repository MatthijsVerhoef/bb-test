import { Frame, Lock } from "lucide-react";
import {
  BagageTrailer,
  BicycleTrailer,
  BicycleTrailerDouble,
  BikeTrailer,
  BoatTrailerDouble,
  CampingTrailer,
  CarTrailer,
  ClosedTrailer,
  ClosedTrailerDouble,
  DrawBarTrailer,
  FlatTrailer,
  FlatTrailerClosed,
  FlatTrailerClosedDouble,
  FlatTrailerDouble,
  FoodTrailer,
  Hitch,
  HorseTrailer,
  LongLoad,
  Net,
  Pilon2,
  PlateauTrailer,
  PlateauTrailerDouble,
  PlugLeft,
  PlugRight,
  Ramps,
  TipperTrailer,
  TipperTrailerDouble,
  TransportTrailer,
  TransportTrailerDouble,
  UnbrakedTrailer,
  UnbrakedTrailerDouble,
  Wheelbarrow,
} from "@/lib/icons/trailer-icons";

export const TrailerTypes = [
  {
    id: 1,
    trailerType: "Plateauwagen enkelasser",
    averagePrice: 25,
    maxLength: 450,
    maxWidth: 250,
    maxHeight: 150,
    maxWeight: 750,
    maxCapacity: 1600,
    minLength: 100,
    minWidth: 50,
    minHeight: 20,
    minWeight: 80,
    minCapacity: 300,
    icon: <PlateauTrailer size={30} strokeWidth="1.4" />,
    white_icon: (
      <img
        width={30}
        alt="icon"
        src={"/trailerIcons/white/box_icon_small_w.svg"}
      />
    ),
    description:
      "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
    image:
      "http://www.aanhangwagenverkoop.nl/wp-content/uploads/2016/05/SA-PS1513-270X150-1350KG-1.jpg",
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
    minLength: 200,
    minWidth: 80,
    minHeight: 20,
    minWeight: 140,
    minCapacity: 700,
    icon: <PlateauTrailerDouble size={36} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={36}
        alt="icon"
        src={"/trailerIcons/white/box_icon_large_w.svg"}
      />
    ),
    description:
      "Plateauwagens zijn aanhangers waarbij de wielen zich onder de draagbak bevinden, de zijboorden van deze aanhanger kunnen open waardoor laden en lossen makkelijk gaat. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
    image:
      "https://www.jekuntmijhuren.nl/wp-content/uploads/2016/05/tandemasser-plateauwagen-4mtr-115-1.jpg",
  },
  {
    id: 3,
    trailerType: "Ongeremd enkelasser",
    averagePrice: 25,
    maxLength: 350,
    maxWidth: 200,
    maxHeight: 150,
    maxWeight: 450,
    maxCapacity: 800,
    minLength: 50,
    minWidth: 50,
    minHeight: 20,
    minWeight: 90,
    minCapacity: 280,
    icon: <UnbrakedTrailer size={30} strokeWidth="1.4" />,

    white_icon: (
      <img
        width={30}
        alt="icon"
        src={"/trailerIcons/white/unbraked_icon_small_w.svg"}
      />
    ),
    description:
      "Deze aanhangwagens zijn vaak kleiner omdat het totaalgewicht niet boven de 750 kg mag uitkomen. Meestal mogen deze aanhangwagens zonder een E rijbewijs getrokken worden. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
    image:
      "http://www.aanhangwagenverkoop.nl/wp-content/uploads/2015/05/AN-BSX750-251X130-VZ-BASISUITV-OPT-NETHAAKSET.jpg",
  },
  {
    id: 4,
    trailerType: "Ongeremd dubbelasser",
    averagePrice: 30,
    maxLength: 450,
    maxWidth: 250,
    maxHeight: 150,
    maxWeight: 800,
    maxCapacity: 1350,
    minLength: 100,
    minWidth: 100,
    minHeight: 20,
    minWeight: 190,
    minCapacity: 580,
    icon: <UnbrakedTrailerDouble size={34} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={36}
        alt="icon"
        src={"/trailerIcons/white/unbraked_icon_large_w.svg"}
      />
    ),
    description:
      "Deze aanhangwagens zijn vaak kleiner omdat het totaalgewicht niet boven de 750 kg mag uitkomen. Meestal mogen deze aanhangwagens zonder een E rijbewijs getrokken worden. Een enkele as betekent dat de aanhanger 2 wielen bedraagt. Een dubbele as betekend dat de aanhanger 4 wielen bedraagt.",
    image:
      "https://www.wk-eerbeek.nl/wp-content/uploads/2017/01/Twins-aluminium-tandemasser-met-koprek-en-neuswiel-en-kunststof-spatborden.jpg",
  },
  {
    id: 5,
    trailerType: "Bagage aanhanger",
    averagePrice: 30,
    maxLength: 250,
    maxWidth: 200,
    maxHeight: 170,
    maxWeight: 400,
    maxCapacity: 600,
    minLength: 80,
    minWidth: 70,
    minHeight: 25,
    minWeight: 80,
    minCapacity: 190,
    icon: <BagageTrailer size={30} strokeWidth="1.4" />,

    white_icon: (
      <img
        width={30}
        alt="icon"
        src={"/trailerIcons/white/bagage_icon_w.svg"}
      />
    ),
    description:
      "De bagage aanhanger is een kleine aanhanger met als voornaamste doeleinde kamperen of andere recreatieve activiteiten. ",
    image:
      "https://titanjelsum.nl/wp-content/uploads/2019/02/Humbaur-HA751611-165x110x35cm-750kg-ongeremd-deksel-imperial-6-640-x-480.jpg",
  },
  {
    id: 6,
    trailerType: "Schamel aanhanger",
    averagePrice: 75,
    maxLength: 850,
    maxWidth: 300,
    maxHeight: 150,
    maxWeight: 2200,
    maxCapacity: 3800,
    minLength: 280,
    minWidth: 110,
    minHeight: 20,
    minWeight: 500,
    minCapacity: 1600,
    icon: <DrawBarTrailer size={34} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={36}
        alt="icon"
        src={"/trailerIcons/white/schamel_icon_w.svg"}
      />
    ),
    description:
      "Deze aanhangwagens zijn voorzien van een draaibare vooras. Dit heeft als voordeel dat de wagen stabieler achter het trekkend voertuig aanloopt. Dit soort aanhangwagens zijn vaak langer dan de gewone wagens, maar ook een korte uitvoering is beschikbaar",
    image: "https://www.betanco.nl/upload/aanhangers/410_3.jpg",
  },
  {
    id: 7,
    trailerType: "Kipper enkelasser",
    averagePrice: 55,
    maxLength: 450,
    maxWidth: 250,
    maxHeight: 150,
    maxWeight: 900,
    maxCapacity: 1600,
    minLength: 120,
    minWidth: 60,
    minHeight: 20,
    minWeight: 175,
    minCapacity: 550,
    icon: <TipperTrailer size={30} strokeWidth="1.4" />,

    white_icon: (
      <img
        width={30}
        alt="icon"
        src={"/trailerIcons/white/kipper_icon_small_w.svg"}
      />
    ),
    description:
      "Kippers zijn aanhangers waarbij de bak omhooog geschoven kan worden waardoor lossen makkelijk kan worden uitgevoerd. Kippers in vele maten en gewichten leverbaar. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
    image:
      "https://www.jozua-aanhangwagens.nl/foto/3400/1000/files/Media/tt2012_ifor_williams_enkelasser_kipper_1_jpg.jpg",
  },
  {
    id: 8,
    trailerType: "Kipper dubbelasser",
    averagePrice: 60,
    maxLength: 650,
    maxWidth: 300,
    maxHeight: 150,
    maxWeight: 1300,
    maxCapacity: 3300,
    minLength: 200,
    minWidth: 80,
    minHeight: 20,
    minWeight: 300,
    minCapacity: 950,
    icon: <TipperTrailerDouble size={34} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={36}
        alt="icon"
        src={"/trailerIcons/white/kipper_icon_large_w.svg"}
      />
    ),
    description:
      "Kippers zijn aanhangers waarbij de bak omhooog geschoven kan worden waardoor lossen makkelijk kan worden uitgevoerd. Kippers in vele maten en gewichten leverbaar. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
    image:
      "https://titanjelsum.nl/wp-content/uploads/2021/11/DSC07283-640-x-480-1200x900.jpg",
  },
  {
    id: 9,
    trailerType: "Transporter enkelasser",
    averagePrice: 55,
    maxLength: 450,
    maxWidth: 250,
    maxHeight: 300,
    maxWeight: 800,
    maxCapacity: 1600,
    minLength: 120,
    minWidth: 50,
    minHeight: 60,
    minWeight: 200,
    minCapacity: 580,
    icon: <TransportTrailer size={30} strokeWidth="1.4" />,

    white_icon: (
      <img
        width={30}
        alt="icon"
        src={"/trailerIcons/white/plateau_icon_small_w.svg"}
      />
    ),
    description:
      "Autotransporters zijn er in vele verschillende uitvoeringen. Dit kan zijn een kleine enkelas aanhangwagen voor bijvoorbeeld het vervoeren van een brommobiel of een smart , tot het vervoeren van 2 auto’s op een aanhangwagen.",
    image: "https://cdn.webshopapp.com/shops/255717/files/266248229/image.jpg",
  },
  {
    id: 10,
    trailerType: "Transporter dubbelasser",
    averagePrice: 65,
    maxLength: 650,
    maxWidth: 300,
    maxHeight: 300,
    maxWeight: 1350,
    maxCapacity: 3300,
    minLength: 200,
    minWidth: 100,
    minHeight: 60,
    minWeight: 390,
    minCapacity: 950,
    icon: <TransportTrailerDouble size={34} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={36}
        alt="icon"
        src={"/trailerIcons/white/plateau_icon_large_w.svg"}
      />
    ),
    description:
      "Autotransporters zijn er in vele verschillende uitvoeringen. Dit kan zijn een kleine enkelas aanhangwagen voor bijvoorbeeld het vervoeren van een brommobiel of een smart , tot het vervoeren van 2 auto’s op een aanhangwagen.",
    image: "https://cdn.webshopapp.com/shops/255717/files/266248229/image.jpg",
  },
  {
    id: 11,
    trailerType: "Gesloten enkelasser",
    averagePrice: 45,
    maxLength: 450,
    maxWidth: 250,
    maxHeight: 320,
    maxWeight: 800,
    maxCapacity: 1600,
    minLength: 120,
    minWidth: 50,
    minHeight: 70,
    minWeight: 200,
    minCapacity: 600,
    icon: <ClosedTrailer size={30} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={30}
        alt="icon"
        src={"/trailerIcons/white/closed_icon_small_w.svg"}
      />
    ),
    description:
      "Gesloten aanhangers zijn worden gebruikt als de lading droog moet blijven en of afgeschermd moet zijn van de buitenwereld. De panelen zijn zodanig geplaatst en afgewerkt in de aluminium profielen dat er geen water in de aanhanger komt. Een enkele as betekent dat de aanhanger 2 wielen bedraagt.",
    image:
      "https://www.wk-eerbeek.nl/wp-content/uploads/2017/01/6-Twins-gesloten-enkelasser-Twinarc-1.jpg",
  },
  {
    id: 12,
    trailerType: "Gesloten dubbelasser",
    averagePrice: 50,
    maxLength: 680,
    maxWidth: 320,
    maxHeight: 320,
    maxWeight: 1350,
    maxCapacity: 3200,
    minLength: 200,
    minWidth: 80,
    minHeight: 70,
    minWeight: 340,
    minCapacity: 1100,
    icon: <ClosedTrailerDouble size={34} strokeWidth="1.6" />,

    white_icon: (
      <img
        width={36}
        alt="icon"
        src={"/trailerIcons/white/closed_icon_large_w.svg"}
      />
    ),
    description:
      "Gesloten aanhangers zijn worden gebruikt als de lading droog moet blijven en of afgeschermd moet zijn van de buitenwereld. De panelen zijn zodanig geplaatst en afgewerkt in de aluminium profielen dat er geen water in de aanhanger komt. Een dubbele as betekent dat de aanhanger 4 wielen bedraagt.",
    image:
      "https://www.jagersaanhangwagens.nl/wp-content/uploads/2017/12/DSC_0484.jpg",
  },
  {
    id: 13,
    trailerType: "Fietsen aanhanger",
    averagePrice: 25,
    maxLength: 250,
    maxWidth: 190,
    maxHeight: 150,
    maxWeight: 160,
    maxCapacity: 280,
    minLength: 50,
    minWidth: 120,
    minHeight: 25,
    minWeight: 25,
    minCapacity: 45,
    icon: <BicycleTrailer size={30} strokeWidth="1.4" />,

    white_icon: (
      <img width={30} alt="icon" src={"/trailerIcons/white/bike_icon_w.svg"} />
    ),
    description:
      "Een fiestenaanhanger wordt over het algemeen gebruikt voor het vervoeren van Elektrische fietsen. De elektrische fiets is veelal te zwaar voor een fietsendragen op de trekhaak",
    image:
      "https://www.deboer-aanhangwagen.nl/templates/images/uploads/137nnn-9.jpg",
  },
  {
    id: 14,
    trailerType: "Paardentrailer",
    averagePrice: 38,
    maxLength: 600,
    maxWidth: 310,
    maxHeight: 340,
    maxWeight: 1700,
    maxCapacity: 2400,
    minLength: 200,
    minWidth: 100,
    minHeight: 130,
    minWeight: 450,
    minCapacity: 800,
    icon: <HorseTrailer size={34} strokeWidth="1.6" />,

    white_icon: (
      <img width={36} alt="icon" src={"/trailerIcons/white/horse_icon_w.svg"} />
    ),
    description:
      "Een paardentrailer is een vervoermiddel bedoeld voor het vervoeren van paarden. Een paardentrailer wordt gebruikt om paarden van een locatie naar de andere te verplaatsen. Paardentrailers zijn beschikbaar is verschillende maten.",
    image:
      "https://cdn.pixabay.com/photo/2018/05/02/18/51/horse-trailer-3369387_1280.jpg",
  },
  {
    id: 15,
    trailerType: "Boot aanhanger",
    averagePrice: 35,
    maxLength: 780,
    maxWidth: 320,
    maxHeight: 150,
    maxWeight: 900,
    maxCapacity: 2400,
    minLength: 260,
    minWidth: 75,
    minHeight: 20,
    minWeight: 180,
    minCapacity: 300,
    icon: <BoatTrailerDouble size={34} strokeWidth="1.6" />,
    white_icon: (
      <img width={36} alt="icon" src={"/trailerIcons/white/boat_icon_w.svg"} />
    ),
    description:
      "Een boottrailer is een aanhangwagen die speciaal is ontworpen om boten van en naar het water te transporteren. Het wordt gebruikt om de boot vanaf het land naar het water te rijden en vice versa. Boottrailers zijn verkrijgbaar in verschillende maten en modellen, afhankelijk van het gewicht en de grootte van de boot die wordt getransporteerd.",
    image: "https://images.stockfreeimages.com/2695/sfixl/26957519.jpg",
  },
  {
    id: 16,
    trailerType: "Auto aanhanger",
    averagePrice: 35,
    maxLength: 780,
    maxWidth: 320,
    maxHeight: 150,
    maxWeight: 900,
    maxCapacity: 2400,
    minLength: 260,
    minWidth: 75,
    minHeight: 20,
    minWeight: 180,
    minCapacity: 300,
    icon: <CarTrailer size={36} />,
    white_icon: (
      <img width={36} alt="icon" src={"/trailerIcons/white/boat_icon_w.svg"} />
    ),
    description:
      "Een boottrailer is een aanhangwagen die speciaal is ontworpen om boten van en naar het water te transporteren. Het wordt gebruikt om de boot vanaf het land naar het water te rijden en vice versa. Boottrailers zijn verkrijgbaar in verschillende maten en modellen, afhankelijk van het gewicht en de grootte van de boot die wordt getransporteerd.",
    image:
      "https://www.vervloed.nl/wp-content/uploads/Boottrailer-huur-enkelasser-kantelbaar-NV171-2.jpg",
  },
  {
    id: 17,
    trailerType: "Transporter enkelasser",
    averagePrice: 35,
    maxLength: 780,
    maxWidth: 320,
    maxHeight: 150,
    maxWeight: 900,
    maxCapacity: 2400,
    minLength: 260,
    minWidth: 75,
    minHeight: 20,
    minWeight: 180,
    minCapacity: 300,
    icon: <FlatTrailerClosed size={30} />,
    white_icon: (
      <img width={36} alt="icon" src={"/trailerIcons/white/boat_icon_w.svg"} />
    ),
    description:
      "Een boottrailer is een aanhangwagen die speciaal is ontworpen om boten van en naar het water te transporteren. Het wordt gebruikt om de boot vanaf het land naar het water te rijden en vice versa. Boottrailers zijn verkrijgbaar in verschillende maten en modellen, afhankelijk van het gewicht en de grootte van de boot die wordt getransporteerd.",
    image:
      "https://www.vervloed.nl/wp-content/uploads/Boottrailer-huur-enkelasser-kantelbaar-NV171-2.jpg",
  },
  {
    id: 18,
    trailerType: "Transporter dubbelasser",
    averagePrice: 35,
    maxLength: 780,
    maxWidth: 320,
    maxHeight: 150,
    maxWeight: 900,
    maxCapacity: 2400,
    minLength: 260,
    minWidth: 75,
    minHeight: 20,
    minWeight: 180,
    minCapacity: 300,
    icon: <FlatTrailerClosedDouble size={36} />,
    white_icon: (
      <img width={36} alt="icon" src={"/trailerIcons/white/boat_icon_w.svg"} />
    ),
    description:
      "Een boottrailer is een aanhangwagen die speciaal is ontworpen om boten van en naar het water te transporteren. Het wordt gebruikt om de boot vanaf het land naar het water te rijden en vice versa. Boottrailers zijn verkrijgbaar in verschillende maten en modellen, afhankelijk van het gewicht en de grootte van de boot die wordt getransporteerd.",
    image:
      "https://www.vervloed.nl/wp-content/uploads/Boottrailer-huur-enkelasser-kantelbaar-NV171-2.jpg",
  },
];

export const AccessoireItems = [
  {
    id: 1,
    accessoire: "Disselslot",
    icon: <Lock size={20} strokeWidth={1.5} />,
    description:
      "Dit is een slot dat op de dissel van de aanhanger wordt geplaatst om te voorkomen dat de aanhanger kan worden gekoppeld aan een trekhaak en gestolen kan worden.",
  },
  {
    id: 2,
    accessoire: "Oprijplaten",
    icon: <Ramps size={20} strokeWidth={1.5} />,
    description:
      "Dit zijn platen die op de grond kunnen worden gelegd om de aanhanger op te rijden. Ze worden gebruikt om het laden en lossen van de aanhanger gemakkelijker te maken, vooral wanneer de aanhanger laag bij de grond is.",
  },
  {
    id: 3,
    accessoire: "7 naar 13 polige adapter",
    icon: <PlugRight size={20} />,
    description:
      "Dit is een adapter die wordt gebruikt om een aanhanger met een 7-polige stekker aan te sluiten op een trekhaak met een 13-polige aansluiting.",
  },
  {
    id: 4,
    accessoire: "13 naar 7 polige adapter",
    icon: <PlugLeft size={20} strokeWidth={1.5} />,
    description:
      "Dit is een adapter die wordt gebruikt om een aanhanger met een 13-polige stekker aan te sluiten op een trekhaak met een 7-polige aansluiting.",
  },
  {
    id: 5,
    accessoire: "Afdek zeil",
    icon: <Frame size={20} strokeWidth={1.5} />,
    description:
      "Dit is een zeil dat over de lading van de aanhanger kan worden gelegd om deze te beschermen tegen regen, wind en andere weersomstandigheden.",
  },
  {
    id: 6,
    accessoire: "Afdek net",
    icon: <Net size={20} strokeWidth={1.5} />,
    description:
      "Dit is een net dat over de lading van de aanhanger kan worden gespannen om te voorkomen dat deze tijdens het transport van de aanhanger valt.",
  },
  // {
  //   id: 7,
  //   accessoire: 'Wielklem',
  //   icon: (
  //     <img
  //       width={26}
  //       alt="icon"
  //       src={'/trailerIcons/accessoires/tire_lock.svg'}
  //     />
  //   ),
  //   description:
  //     'Dit is een apparaat dat om het wiel van de aanhanger wordt geplaatst om te voorkomen dat deze kan worden verplaatst of gestolen.',
  // },
  // {
  //   id: 8,
  //   accessoire: 'Reserve wiel',
  //   icon: (
  //     <img
  //       width={26}
  //       alt="icon"
  //       src={'/trailerIcons/accessoires/spare_tire.svg'}
  //     />
  //   ),
  //   description:
  //     'Dit is een extra wiel dat wordt meegenomen in het geval van een lekke band of ander probleem met een van de wielen van de aanhanger.',
  // },
  // {
  //   id: 9,
  //   accessoire: 'Afgesloten kist',
  //   icon: <TbPackage size={27} />,
  //   description:
  //     'Dit is een kist of container die op de aanhanger kan worden bevestigd om spullen veilig op te slaan en te vervoeren. Ze worden vaak gebruikt door professionals die gereedschap en andere apparatuur moeten meenemen naar een werklocatie.',
  // },
  {
    id: 10,
    accessoire: "Pionnen",
    icon: <Pilon2 size={20} />,
    description:
      "Dit is een kist of container die op de aanhanger kan worden bevestigd om spullen veilig op te slaan en te vervoeren. Ze worden vaak gebruikt door professionals die gereedschap en andere apparatuur moeten meenemen naar een werklocatie.",
  },
  {
    id: 11,
    accessoire: "Kruiwagen",
    icon: <Wheelbarrow size={20} />,
    description:
      "Dit is een kist of container die op de aanhanger kan worden bevestigd om spullen veilig op te slaan en te vervoeren. Ze worden vaak gebruikt door professionals die gereedschap en andere apparatuur moeten meenemen naar een werklocatie.",
  },
  {
    id: 12,
    accessoire: "Lange lading bord",
    icon: <LongLoad size={20} />,
    description:
      "Dit is een kist of container die op de aanhanger kan worden bevestigd om spullen veilig op te slaan en te vervoeren. Ze worden vaak gebruikt door professionals die gereedschap en andere apparatuur moeten meenemen naar een werklocatie.",
  },
];

export const TrailerCategories = [
  {
    id: 1,
    trailerType: "Open aanhanger",
    averagePrice: 35,
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
    icon: <TransportTrailerDouble size={36} strokeWidth="1.4" />,
    description:
      "De open aanhanger is een eenvoudige, maar effectieve oplossing voor diverse transportbehoeften. Zonder zij- of bovenwanden kun je makkelijk grote of ongewoon gevormde objecten laden. Dit maakt het een ideale keuze voor tuinwerkzaamheden, het verhuizen van meubels, of het afvoeren van bouwafval. De maximale laadcapaciteit gaat meestal tot 750 kg, waardoor deze aanhanger heel toegankelijk is. Met betrekking tot het trekken van de aanhanger voldoet een gemiddelde personenauto meestal al aan de eisen. Als veiligheidstip is het belangrijk op te merken dat je lading niet beschermd is tegen de elementen. Bij slecht weer is het dus aan te raden om een zeil te gebruiken om je spullen te beschermen.",
    image: "/images/trailerTypes/open-trailer.png",
  },
  {
    id: 2,
    trailerType: "Gesloten aanhanger",
    averagePrice: 60,
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
    icon: <ClosedTrailerDouble size={36} strokeWidth="1.4" />,
    description:
      "Als je iets meer beveiliging nodig hebt, is een gesloten aanhanger de beste keuze. Deze is perfect voor het vervoeren van elektronica, kunstwerken, meubels en andere kostbare of kwetsbare items. De afgesloten structuur zorgt voor extra veiligheid en beschermt je lading tegen weersinvloeden. De laadcapaciteit varieert, maar ligt meestal tussen de 750 kg en 2.000 kg. Voor het trekken van een gesloten aanhanger is vaak een SUV of een kleine vrachtwagen meer geschikt. Vergeet niet om de deuren goed te vergrendelen voor vertrek om het risico op diefstal te minimaliseren.",
    image: "/images/trailerTypes/closed-trailer.png",
  },
  {
    id: 3,
    trailerType: "Autotransporter",
    averagePrice: 100,
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
    icon: <CarTrailer size={36} strokeWidth="1.4" />,
    description:
      "Voor het vervoer van voertuigen is er geen betere optie dan een autotransporter. Deze aanhangers zijn speciaal ontworpen met oprijplaten en bevestigingspunten om het laden en vastzetten van voertuigen te vergemakkelijken. Qua laadcapaciteit kun je rekenen op een maximum tot ongeveer 2.500 kg. Een stevige SUV of een vrachtwagen is in dit geval de meest aanbevolen trekauto. Als het om veiligheid gaat, zorg er dan voor dat het voertuig goed is vastgemaakt met bevestigingsriemen om ongelukken tijdens de rit te voorkomen.",
    image: "/images/trailerTypes/car-trailer.png",
  },
  {
    id: 4,
    trailerType: "Paardentrailer",
    averagePrice: 75,
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
    icon: <HorseTrailer size={36} strokeWidth="1.4" />,
    description:
      "Een paardentrailer is meer dan een transportmiddel; het is een speciaal ontworpen verblijf voor je paard tijdens het vervoer. Van een zachte vloer tot ruimtes voor voer en water, alles is gericht op het welzijn van het dier. De laadcapaciteit kan variëren maar ligt meestal tussen de 1.200 en 2.000 kg. Sterke SUVs of pick-up trucks zijn het meest geschikt voor het trekken van een paardentrailer. Vergeet niet om alle veiligheidssluitingen en ventilatiesystemen te controleren voordat je vertrekt.",
    image: "/images/trailerTypes/horse-trailer.png",
  },
  {
    id: 5,
    trailerType: "Boottrailer",
    averagePrice: 70,
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
    icon: <BoatTrailerDouble size={36} strokeWidth="1.4" />,
    description:
      "Voor waterliefhebbers biedt een boottrailer het gemak van transport naar en van de waterkant. Deze aanhangers zijn specifiek ontworpen om een boot veilig te vervoeren, met een maximale laadcapaciteit variërend van 1.000 tot 2.500 kg. In dit geval zijn vooral SUVs en vrachtwagens aan te raden als trekvoertuig. Zorg ervoor dat je boot goed is bevestigd en dat je de nodige vergunningen hebt voordat je aan je reis begint.",
    image: "/images/trailerTypes/boat-trailer.png",
  },
  {
    id: 6,
    trailerType: "Kipper",
    averagePrice: 55,
    minLength: 150,
    maxLength: 600,
    minWidth: 90,
    maxWidth: 350,
    minHeight: 0,
    maxHeight: 1000,
    minWeight: 150,
    maxWeight: 1500,
    minCapacity: 300,
    maxCapacity: 2500,
    icon: <TipperTrailerDouble size={36} strokeWidth="1.4" />,
    description:
      "De kipper is je beste optie als je losse materialen zoals zand, grind of aarde wilt vervoeren. Dankzij een hydraulisch kantelmechanisme is lossen een fluitje van een cent. Deze aanhangers hebben meestal een maximale laadcapaciteit van ongeveer 2.000 kg. Een stevige SUV of zelfs een kleine vrachtwagen is meestal de beste keuze voor het trekken van een kipper. Let erop dat je de hydraulica correct gebruikt om ongelukken te voorkomen.",
    image: "/images/trailerTypes/kipper-trailer.png",
  },
  {
    id: 7,
    trailerType: "Motorfiets aanhanger",
    averagePrice: 40,
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
    icon: <BikeTrailer size={36} strokeWidth="1.4" />,
    description:
      "Voor wie een motorfiets of scooter wil vervoeren, is de motorfietsaanhanger de ideale oplossing. Deze aanhangers zijn vaak voorzien van speciale haken en riemen voor veilig transport. De maximale laadcapaciteit is meestal rond de 500 kg, wat betekent dat een gemiddelde personenauto in veel gevallen voldoet. Zorg er wel voor dat je motorfiets stevig vastgezet is om beweging tijdens het rijden te minimaliseren.",
    image: "/images/trailerTypes/motorcycle-trailer.png",
  },
  {
    id: 8,
    trailerType: "Flatbed aanhanger",
    averagePrice: 70,
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
    icon: <FlatTrailerClosedDouble size={36} strokeWidth="1.4" />,
    description:
      "Als je grote, lange objecten zoals houten planken of staalconstructies moet vervoeren, kijk dan naar een flatbed aanhanger. Met zijn open structuur en een laadcapaciteit die kan oplopen tot 3.000 kg, is deze aanhanger ontzettend veelzijdig. Voor het trekken ervan is een zware SUV of een vrachtwagen aanbevolen. Het is cruciaal om je lading goed te beveiligen, gezien de open structuur van de aanhanger.",
    image: "/images/trailerTypes/flatbed-trailer.png",
  },
  {
    id: 9,
    trailerType: "Bagage aanhanger",
    averagePrice: 70,
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
    icon: <BagageTrailer size={30} strokeWidth="1.4" />,
    description:
      "Voor extra bagageruimte tijdens kampeertrips of grote gezinsuitjes is de bagage aanhanger ideaal. Deze compacte aanhangers kunnen verrassend veel bagage bevatten en hebben meestal een laadcapaciteit van rond de 500 kg. Een gewone personenauto is meestal voldoende om deze aanhanger te trekken. Als veiligheidstip is het aan te raden om te controleren of de aanhanger afsluitbaar is om diefstal te voorkomen",
    image: "/images/trailerTypes/bagage-trailer.png",
  },
  {
    id: 10,
    trailerType: "Verkoopwagen",
    averagePrice: 200,
    minLength: 150,
    maxLength: 1000,
    minWidth: 90,
    maxWidth: 500,
    minHeight: 100,
    maxHeight: 500,
    minWeight: 400,
    maxWeight: 4500,
    minCapacity: 250,
    maxCapacity: 3000,
    icon: <FoodTrailer size={36} strokeWidth="1.4" />,
    description:
      "De verkoopwagen doet dubbel dienst als transportmiddel en mobiele bedrijfsruimte, ideaal voor foodtrucks of marktverkopers. Met een laadcapaciteit die kan variëren, meestal tussen de 1.500 en 3.000 kg, is een vrachtwagen of een zware SUV het meest geschikt om deze te trekken. Vergeet niet om na te gaan of je speciale vergunningen nodig hebt om te opereren.",
    image: "/images/trailerTypes/food-trailer.png",
  },
  {
    id: 11,
    trailerType: "Fietsen aanhanger",
    averagePrice: 20,
    minLength: 50,
    maxLength: 500,
    minWidth: 40,
    maxWidth: 350,
    minHeight: 0,
    maxHeight: 1000,
    minWeight: 0,
    maxWeight: 300,
    minCapacity: 20,
    maxCapacity: 400,
    icon: <BicycleTrailerDouble size={36} strokeWidth="1.4" />,
    description:
      "De fietsenaanhanger is perfect voor het vervoeren van meerdere fietsen. Met speciale rekken en bevestigingsmechanismen kun je fietsen veilig en schadevrij transporteren. De maximale laadcapaciteit is meestal ongeveer 500 kg, wat betekent dat een gemiddelde personenauto voldoende is. Zorg dat de fietsen stevig vastzitten om schade tijdens het rijden te vermijden.",
    image: "",
  },
  {
    id: 12,
    trailerType: "Schamel aanhangers",
    averagePrice: 90,
    minLength: 250,
    maxLength: 1500,
    minWidth: 90,
    maxWidth: 500,
    minHeight: 0,
    maxHeight: 1000,
    minWeight: 500,
    maxWeight: 4500,
    minCapacity: 900,
    maxCapacity: 8000,
    icon: <DrawBarTrailer size={36} strokeWidth="1.4" />,
    description:
      "De schamel aanhanger is zeer geschikt voor het vervoeren van zware en lange ladingen zoals bouwmaterialen of machines. De laadcapaciteit kan oplopen tot 3.500 kg, wat betekent dat je een vrachtwagen nodig zult hebben om deze te trekken. Zorg ervoor dat je de lading evenredig verdeelt voor een stabiele rit.",
    image: "",
  },
  {
    id: 13,
    trailerType: "Plateauwagens",
    averagePrice: 55,
    minLength: 150,
    maxLength: 900,
    minWidth: 70,
    maxWidth: 500,
    minHeight: 0,
    maxHeight: 1000,
    minWeight: 250,
    maxWeight: 2500,
    minCapacity: 400,
    maxCapacity: 4000,
    icon: <UnbrakedTrailerDouble size={36} strokeWidth="1.4" />,
    description:
      "De plateauwagen biedt met zijn vlakke laadvloer gemak bij het laden en lossen van grote objecten, zoals pallets en bouwmaterialen. Met een laadcapaciteit die kan variëren tussen de 750 kg en 3.000 kg, is een zwaardere SUV of vrachtwagen meestal de beste keuze voor het trekken. Vergeet niet om de lading goed vast te zetten om verschuiving te voorkomen.",
    image: "/images/trailerTypes/plateau-trailer.png",
  },
  //   {
  //     id: 14,
  //     trailerType: "Kampeer aanhanger",
  //     averagePrice: 50,
  //     minLength: 100,
  //     maxLength: 900,
  //     minWidth: 70,
  //     maxWidth: 450,
  //     minHeight: 50,
  //     maxHeight: 500,
  //     minWeight: 100,
  //     maxWeight: 1500,
  //     minCapacity: 100,
  //     maxCapacity: 1500,
  //     icon: <CampingTrailer size={36} strokeWidth="1.4" />,
  //     description:
  //       "De kampeeraanhanger is je thuis weg van huis, ideaal voor outdoor avonturen en gezinsvakanties. Deze aanhangers zijn vaak uitgerust met basisvoorzieningen zoals een bed, keuken, en soms zelfs een badkamer. Afhankelijk van het model kan de laadcapaciteit variëren, maar ligt meestal tussen de 750 kg en 1.500 kg. Een SUV of een sterke personenauto is over het algemeen geschikt voor het trekken van een kampeeraanhanger. Voordat je op pad gaat, controleer of alle voorzieningen naar behoren werken en of je over de juiste vergunningen beschikt.",
  //     image: "/images/trailerTypes/camping-trailer.png",
  //   },
  {
    id: 15,
    trailerType: "Overig",
    averagePrice: 0,
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
    icon: <Hitch size={26} strokeWidth="1.4" />,
  },
];
