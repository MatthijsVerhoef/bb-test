import {
  BagageTrailer,
  BicycleTrailer,
  BikeTrailer,
  BoatTrailerDouble,
  CarTrailer,
  ClosedTrailerDouble,
  DrawBarTrailer,
  FlatTrailerClosedDouble,
  FoodTrailer,
  Hitch,
  HorseTrailer,
  PlateauTrailerDouble,
  TipperTrailerDouble,
  TransportTrailerDouble,
} from "../icons/trailer-icons";

export const trailerTypes = [
  {
    id: "eb2c45c8-7d27-4087-ab41-998da6144947",
    icon: <TransportTrailerDouble />,
    translations: {
      nl: {
        type: "Open aanhanger",
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
              <li>
                <strong>Open laadbak</strong>: ideaal voor grote en onregelmatig
                gevormde voorwerpen
              </li>
              <li>
                <strong>Weersinvloeden</strong>: lading is blootgesteld aan
                regen en wind
              </li>
              <li>
                <strong>Veiligheid</strong>: controleer bandenspanning en
                verlichting regelmatig
              </li>
              <li>
                <strong>Rijbewijs</strong>: meestal volstaat rijbewijs B
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Let op de maximaal toegestane massa (MTM)</li>
              <li>
                Verdeel het gewicht gelijkmatig en let op correcte kogeldruk
              </li>
              <li>Houd extra afstand tijdens het rijden</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Open trailer",
        description: (
          <>
            <p className="mb-4">
              Open trailers feature an open loading platform without side or
              rear walls. This makes them particularly versatile for
              transporting large, irregular, or heavy loads such as garden
              materials, construction waste, or furniture. They are ideal for
              short transport in urban environments but require extra attention
              when securing the load.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Open cargo bed</strong>: ideal for large and irregularly
                shaped objects
              </li>
              <li>
                <strong>Weather exposure</strong>: cargo is exposed to rain and
                wind
              </li>
              <li>
                <strong>Safety</strong>: check tire pressure and lighting
                regularly
              </li>
              <li>
                <strong>License</strong>: usually category B license is
                sufficient
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Pay attention to the maximum authorized mass (MAM)</li>
              <li>Distribute weight evenly and ensure correct nose weight</li>
              <li>Maintain extra distance while driving</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Offener Anhänger",
        description: (
          <>
            <p className="mb-4">
              Offene Anhänger verfügen über eine offene Ladefläche ohne Seiten-
              oder Rückwände. Dies macht sie besonders vielseitig für den
              Transport großer, unregelmäßiger oder schwerer Ladungen wie
              Gartenmaterialien, Bauschutt oder Möbel. Sie sind ideal für kurze
              Transporte in städtischen Gebieten, erfordern aber besondere
              Aufmerksamkeit beim Sichern der Ladung.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Offene Ladefläche</strong>: ideal für große und
                unregelmäßig geformte Gegenstände
              </li>
              <li>
                <strong>Witterungseinflüsse</strong>: Ladung ist Regen und Wind
                ausgesetzt
              </li>
              <li>
                <strong>Sicherheit</strong>: Reifendruck und Beleuchtung
                regelmäßig prüfen
              </li>
              <li>
                <strong>Führerschein</strong>: meist reicht Führerschein B
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Auf die zulässige Gesamtmasse (zGM) achten</li>
              <li>
                Gewicht gleichmäßig verteilen und korrekte Stützlast beachten
              </li>
              <li>Beim Fahren extra Abstand halten</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "c6934ca3-c683-4a71-89eb-ffdefd50bb7b",
    icon: <ClosedTrailerDouble />,
    translations: {
      nl: {
        type: "Gesloten aanhanger",
        description: (
          <>
            <p className="mb-4">
              Gesloten aanhangers bieden volledige bescherming tegen
              weersinvloeden en diefstal. Ideaal voor het veilig vervoeren van
              waardevolle of kwetsbare goederen zoals apparatuur, meubels of
              dozen. Ze zijn populair bij verhuizingen of zakelijke leveringen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Weersbestendig</strong>: lading blijft droog en
                beschermd
              </li>
              <li>
                <strong>Beveiligd</strong>: vaak afsluitbaar met slot
              </li>
              <li>
                <strong>Hoger gewicht</strong>: let op de totale massa
              </li>
              <li>
                <strong>Rijbewijs</strong>: rijbewijs B is vaak voldoende, maar
                controleer MTM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer de hoogte bij lage doorgangen</li>
              <li>Let op windgevoeligheid bij hogere snelheden</li>
              <li>Zorg voor een goede gewichtsverdeling</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Enclosed trailer",
        description: (
          <>
            <p className="mb-4">
              Enclosed trailers provide complete protection against weather
              conditions and theft. Ideal for safely transporting valuable or
              fragile goods such as equipment, furniture, or boxes. They are
              popular for moves or business deliveries.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Weather resistant</strong>: cargo stays dry and
                protected
              </li>
              <li>
                <strong>Secure</strong>: often lockable
              </li>
              <li>
                <strong>Higher weight</strong>: pay attention to total mass
              </li>
              <li>
                <strong>License</strong>: category B license often sufficient,
                but check MAM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check height clearance at low passages</li>
              <li>Be aware of wind sensitivity at higher speeds</li>
              <li>Ensure proper weight distribution</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Geschlossener Anhänger",
        description: (
          <>
            <p className="mb-4">
              Geschlossene Anhänger bieten vollständigen Schutz vor
              Witterungseinflüssen und Diebstahl. Ideal für den sicheren
              Transport wertvoller oder empfindlicher Güter wie Geräte, Möbel
              oder Kartons. Sie sind beliebt bei Umzügen oder geschäftlichen
              Lieferungen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Wetterfest</strong>: Ladung bleibt trocken und geschützt
              </li>
              <li>
                <strong>Sicher</strong>: oft abschließbar
              </li>
              <li>
                <strong>Höheres Gewicht</strong>: auf Gesamtmasse achten
              </li>
              <li>
                <strong>Führerschein</strong>: Führerschein B oft ausreichend,
                aber zGM prüfen
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Höhe bei niedrigen Durchfahrten kontrollieren</li>
              <li>Windanfälligkeit bei höheren Geschwindigkeiten beachten</li>
              <li>Für gute Gewichtsverteilung sorgen</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "fe931657-40f1-4c79-a1b3-09b53f524702",
    icon: <CarTrailer />,
    translations: {
      nl: {
        type: "Autotransporter",
        description: (
          <>
            <p className="mb-4">
              Autotransporters zijn speciaal ontworpen voor het vervoeren van
              auto's of andere voertuigen. Ze beschikken over oprijplaten en
              wielstoppers om het voertuig veilig te laden en vast te zetten.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Laadrails of platen</strong>: makkelijk oprijden met
                voertuig
              </li>
              <li>
                <strong>Vastzetsystemen</strong>: spanbanden, wielklemmen of
                lieren
              </li>
              <li>
                <strong>Belading</strong>: let op de juiste aslast en balans
              </li>
              <li>
                <strong>Rijbewijs</strong>: vaak BE nodig bij hogere MTM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer bandenspanning voor vertrek</li>
              <li>Controleer het zwaartepunt van het geladen voertuig</li>
              <li>Gebruik wielblokken bij parkeren op een helling</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Car trailer",
        description: (
          <>
            <p className="mb-4">
              Car trailers are specially designed for transporting cars or other
              vehicles. They feature loading ramps and wheel stops to safely
              load and secure the vehicle.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Loading rails or ramps</strong>: easy vehicle loading
              </li>
              <li>
                <strong>Securing systems</strong>: tie-down straps, wheel
                clamps, or winches
              </li>
              <li>
                <strong>Loading</strong>: pay attention to proper axle load and
                balance
              </li>
              <li>
                <strong>License</strong>: often BE required for higher MAM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check tire pressure before departure</li>
              <li>Check the center of gravity of the loaded vehicle</li>
              <li>Use wheel chocks when parking on an incline</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Autotransporter",
        description: (
          <>
            <p className="mb-4">
              Autotransporter sind speziell für den Transport von Autos oder
              anderen Fahrzeugen konzipiert. Sie verfügen über Auffahrrampen und
              Radstopper, um das Fahrzeug sicher zu laden und zu befestigen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Ladeschienen oder -rampen</strong>: einfaches Auffahren
                mit Fahrzeug
              </li>
              <li>
                <strong>Befestigungssysteme</strong>: Spanngurte, Radklemmen
                oder Winden
              </li>
              <li>
                <strong>Beladung</strong>: auf richtige Achslast und Balance
                achten
              </li>
              <li>
                <strong>Führerschein</strong>: oft BE bei höherer zGM
                erforderlich
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Reifendruck vor Abfahrt kontrollieren</li>
              <li>Schwerpunkt des beladenen Fahrzeugs prüfen</li>
              <li>Unterlegkeile beim Parken am Hang verwenden</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "477f79d9-18bb-4914-ba88-e4db5ab9ec00",
    icon: <HorseTrailer />,
    translations: {
      nl: {
        type: "Paardentrailer",
        description: (
          <>
            <p className="mb-4">
              Paardentrailers zijn ontworpen voor het veilig en comfortabel
              vervoeren van paarden. Ze beschikken over ventilatie, rubberen
              vloeren en een stabiele constructie.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Veiligheid</strong>: antislipvloer, zijstangen en
                hoofdsteunen
              </li>
              <li>
                <strong>Ventilatie</strong>: belangrijk voor comfort van het
                dier
              </li>
              <li>
                <strong>Rustig rijden</strong>: schokken en bochten beperken
              </li>
              <li>
                <strong>Rijbewijs</strong>: vaak BE vereist
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer vloer en wanden op slijtage</li>
              <li>Laat dieren wennen aan de trailer</li>
              <li>Gebruik stro of rubbermatten voor comfort</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Horse trailer",
        description: (
          <>
            <p className="mb-4">
              Horse trailers are designed for the safe and comfortable transport
              of horses. They feature ventilation, rubber floors, and stable
              construction.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Safety</strong>: anti-slip floor, side bars, and head
                supports
              </li>
              <li>
                <strong>Ventilation</strong>: important for animal comfort
              </li>
              <li>
                <strong>Smooth driving</strong>: minimize jolts and sharp turns
              </li>
              <li>
                <strong>License</strong>: often BE required
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check floor and walls for wear</li>
              <li>Allow animals to get accustomed to the trailer</li>
              <li>Use straw or rubber mats for comfort</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Pferdeanhänger",
        description: (
          <>
            <p className="mb-4">
              Pferdeanhänger sind für den sicheren und komfortablen Transport
              von Pferden konzipiert. Sie verfügen über Belüftung, Gummiböden
              und eine stabile Konstruktion.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Sicherheit</strong>: rutschfester Boden, Seitenstangen
                und Kopfstützen
              </li>
              <li>
                <strong>Belüftung</strong>: wichtig für den Komfort des Tieres
              </li>
              <li>
                <strong>Ruhiges Fahren</strong>: Stöße und Kurven begrenzen
              </li>
              <li>
                <strong>Führerschein</strong>: oft BE erforderlich
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Boden und Wände auf Verschleiß prüfen</li>
              <li>Tiere an den Anhänger gewöhnen lassen</li>
              <li>Stroh oder Gummimatten für Komfort verwenden</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "72cb2f46-8faa-44b1-b90e-6a15a992a037",
    icon: <BoatTrailerDouble />,
    translations: {
      nl: {
        type: "Boottrailer",
        description: (
          <>
            <p className="mb-4">
              Boottrailers zijn speciaal ontworpen voor het vervoer van boten en
              waterscooters. Ze zijn voorzien van rollers of steunen om het
              laden en lossen bij een helling eenvoudig te maken.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Rollers</strong>: voor makkelijk laden en lossen
              </li>
              <li>
                <strong>Waterbestendig</strong>: onderdelen bestand tegen roest
              </li>
              <li>
                <strong>Bevestiging</strong>: gebruik spanbanden en klemmen
              </li>
              <li>
                <strong>Rijbewijs</strong>: controleer MTM t.o.v. trekkend
                voertuig
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Spoel de trailer af na gebruik in zout water</li>
              <li>Controleer verlichting en remmen vóór elke rit</li>
              <li>Gebruik wielklem of slot bij parkeren</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Boat trailer",
        description: (
          <>
            <p className="mb-4">
              Boat trailers are specially designed for transporting boats and
              watercraft. They feature rollers or supports to make loading and
              unloading at a boat ramp easy.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Rollers</strong>: for easy loading and unloading
              </li>
              <li>
                <strong>Water resistant</strong>: components resistant to
                corrosion
              </li>
              <li>
                <strong>Securing</strong>: use tie-down straps and clamps
              </li>
              <li>
                <strong>License</strong>: check MAM versus towing vehicle
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Rinse trailer after use in salt water</li>
              <li>Check lighting and brakes before each trip</li>
              <li>Use wheel clamp or lock when parking</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Bootsanhänger",
        description: (
          <>
            <p className="mb-4">
              Bootsanhänger sind speziell für den Transport von Booten und
              Wassersportfahrzeugen konzipiert. Sie sind mit Rollen oder Stützen
              ausgestattet, um das Be- und Entladen an einer Sliprampe zu
              erleichtern.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Rollen</strong>: für einfaches Be- und Entladen
              </li>
              <li>
                <strong>Wasserbeständig</strong>: Komponenten rostbeständig
              </li>
              <li>
                <strong>Befestigung</strong>: Spanngurte und Klemmen verwenden
              </li>
              <li>
                <strong>Führerschein</strong>: zGM gegenüber Zugfahrzeug prüfen
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Anhänger nach Gebrauch in Salzwasser abspülen</li>
              <li>Beleuchtung und Bremsen vor jeder Fahrt prüfen</li>
              <li>Radklemme oder Schloss beim Parken verwenden</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "57e9ea96-0a80-4b52-b7b7-1cf58ce81239",
    icon: <TipperTrailerDouble />,
    translations: {
      nl: {
        type: "Kipper",
        description: (
          <>
            <p className="mb-4">
              Een kipper heeft een kiepfunctie waarmee je eenvoudig los
              materiaal zoals zand, grind of puin kunt storten. Ze worden veel
              gebruikt in de bouw en landschapsinrichting.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Hydraulisch kiepen</strong>: handig voor losgestort
                materiaal
              </li>
              <li>
                <strong>Robuust</strong>: stevige bouw voor zware belading
              </li>
              <li>
                <strong>Let op helling</strong>: kiepen alleen op vlakke
                ondergrond
              </li>
              <li>
                <strong>Rijbewijs</strong>: BE aanbevolen bij zware lading
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer hydraulica regelmatig op lekkage</li>
              <li>Gebruik enkel bij juiste kogeldruk</li>
              <li>Stort alleen waar toegestaan</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Tipper trailer",
        description: (
          <>
            <p className="mb-4">
              A tipper trailer has a tipping function that allows you to easily
              dump loose materials such as sand, gravel, or rubble. They are
              widely used in construction and landscaping.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Hydraulic tipping</strong>: convenient for loose
                materials
              </li>
              <li>
                <strong>Robust</strong>: sturdy construction for heavy loads
              </li>
              <li>
                <strong>Mind the slope</strong>: tip only on level ground
              </li>
              <li>
                <strong>License</strong>: BE recommended for heavy loads
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check hydraulics regularly for leaks</li>
              <li>Use only with correct nose weight</li>
              <li>Dump only where permitted</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Kipperanhänger",
        description: (
          <>
            <p className="mb-4">
              Ein Kipperanhänger verfügt über eine Kippfunktion, mit der Sie
              lose Materialien wie Sand, Kies oder Schutt einfach schütten
              können. Sie werden häufig im Bau- und Landschaftsbau eingesetzt.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Hydraulisches Kippen</strong>: praktisch für Schüttgut
              </li>
              <li>
                <strong>Robust</strong>: stabile Bauweise für schwere Beladung
              </li>
              <li>
                <strong>Auf Neigung achten</strong>: nur auf ebenem Untergrund
                kippen
              </li>
              <li>
                <strong>Führerschein</strong>: BE empfohlen bei schwerer Ladung
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Hydraulik regelmäßig auf Undichtigkeit prüfen</li>
              <li>Nur bei richtiger Stützlast verwenden</li>
              <li>Nur dort schütten, wo erlaubt</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "21bf20d8-7a41-45ce-8c5f-21fa4a6b3b74",
    icon: <BikeTrailer />,
    translations: {
      nl: {
        type: "Motorfiets aanhanger",
        description: (
          <>
            <p className="mb-4">
              Motorfiets aanhangers zijn speciaal ontworpen voor het veilig
              vervoeren van één of meerdere motoren. Ze bevatten vaak oprijgoten
              en vastzetsystemen voor stabiliteit tijdens het vervoer.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Oprijgoot</strong>: eenvoudig laden en lossen
              </li>
              <li>
                <strong>Vastzetten</strong>: gebruik sjorbanden en
                voorwielklemmen
              </li>
              <li>
                <strong>Bescherming</strong>: dek af met zeil bij lange ritten
              </li>
              <li>
                <strong>Rijbewijs</strong>: meestal voldoende met B, controleer
                MTM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer remmen en verlichting</li>
              <li>Gebruik antislipmatten of blokken bij parkeren</li>
              <li>Beveilig motor extra tegen diefstal</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Motorcycle trailer",
        description: (
          <>
            <p className="mb-4">
              Motorcycle trailers are specially designed for safely transporting
              one or more motorcycles. They often include loading ramps and
              securing systems for stability during transport.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Loading ramp</strong>: easy loading and unloading
              </li>
              <li>
                <strong>Securing</strong>: use tie-down straps and front wheel
                chocks
              </li>
              <li>
                <strong>Protection</strong>: cover with tarp for long trips
              </li>
              <li>
                <strong>License</strong>: usually sufficient with B, check MAM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check brakes and lighting</li>
              <li>Use anti-slip mats or blocks when parking</li>
              <li>Secure motorcycle extra against theft</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Motorradanhänger",
        description: (
          <>
            <p className="mb-4">
              Motorradanhänger sind speziell für den sicheren Transport eines
              oder mehrerer Motorräder konzipiert. Sie enthalten oft
              Auffahrrampen und Befestigungssysteme für Stabilität während des
              Transports.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Auffahrrampe</strong>: einfaches Be- und Entladen
              </li>
              <li>
                <strong>Befestigung</strong>: Zurrgurte und Vorderradklemmen
                verwenden
              </li>
              <li>
                <strong>Schutz</strong>: bei langen Fahrten mit Plane abdecken
              </li>
              <li>
                <strong>Führerschein</strong>: meist ausreichend mit B, zGM
                prüfen
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Bremsen und Beleuchtung kontrollieren</li>
              <li>Rutschfeste Matten oder Keile beim Parken verwenden</li>
              <li>Motorrad zusätzlich gegen Diebstahl sichern</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "d52b4570-399f-4f93-9897-9bdcf55b8637",
    icon: <FlatTrailerClosedDouble />,
    translations: {
      nl: {
        type: "Flatbed aanhanger",
        description: (
          <>
            <p className="mb-4">
              Flatbed aanhangers hebben een vlakke laadvloer zonder opstaande
              randen, wat ze ideaal maakt voor het vervoeren van brede en zware
              lading zoals pallets, machines of bouwmaterialen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Geen zijborden</strong>: makkelijk laden met heftruck
              </li>
              <li>
                <strong>Grote laadcapaciteit</strong>: geschikt voor industriële
                toepassingen
              </li>
              <li>
                <strong>Spanbanden noodzakelijk</strong>: lading goed zekeren
              </li>
              <li>
                <strong>Rijbewijs</strong>: BE vaak vereist
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer of de lading niet uitsteekt buiten de trailer</li>
              <li>Gebruik waarschuwingsborden bij uitstekende lading</li>
              <li>Houd rekening met gewicht op de assen</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Flatbed trailer",
        description: (
          <>
            <p className="mb-4">
              Flatbed trailers have a flat loading platform without raised
              edges, making them ideal for transporting wide and heavy loads
              such as pallets, machines, or construction materials.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>No side boards</strong>: easy loading with forklift
              </li>
              <li>
                <strong>Large load capacity</strong>: suitable for industrial
                applications
              </li>
              <li>
                <strong>Tie-downs necessary</strong>: secure load properly
              </li>
              <li>
                <strong>License</strong>: BE often required
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check that load does not extend beyond trailer</li>
              <li>Use warning signs for overhanging loads</li>
              <li>Consider weight distribution on axles</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Pritschenanhänger",
        description: (
          <>
            <p className="mb-4">
              Pritschenanhänger haben eine flache Ladefläche ohne aufstehende
              Ränder, was sie ideal für den Transport breiter und schwerer
              Ladungen wie Paletten, Maschinen oder Baumaterialien macht.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Keine Seitenborde</strong>: einfaches Laden mit
                Gabelstapler
              </li>
              <li>
                <strong>Große Ladekapazität</strong>: geeignet für industrielle
                Anwendungen
              </li>
              <li>
                <strong>Spanngurte notwendig</strong>: Ladung gut sichern
              </li>
              <li>
                <strong>Führerschein</strong>: BE oft erforderlich
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Prüfen, dass Ladung nicht über Anhänger hinausragt</li>
              <li>Warnschilder bei überstehender Ladung verwenden</li>
              <li>Gewichtsverteilung auf den Achsen beachten</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "d0b967a7-59e0-4d24-b9be-8e6baae609d0",
    icon: <BagageTrailer />,
    translations: {
      nl: {
        type: "Bagage aanhanger",
        description: (
          <>
            <p className="mb-4">
              Bagage aanhangers zijn compacte en gesloten aanhangers, perfect
              voor vakanties, kampeertrips of extra opslag tijdens verhuizingen.
              Ze zijn eenvoudig aan te koppelen en wegen relatief weinig.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Lichtgewicht</strong>: geschikt voor kleinere auto's
              </li>
              <li>
                <strong>Gesloten ruimte</strong>: beschermt tegen diefstal en
                regen
              </li>
              <li>
                <strong>Eenvoudig gebruik</strong>: geen speciale rijervaring
                nodig
              </li>
              <li>
                <strong>Rijbewijs</strong>: rijbewijs B voldoende
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Maximaal toegestane snelheid kan verschillen</li>
              <li>Controleer bandenspanning en kogeldruk</li>
              <li>Plaats zware spullen onderin voor stabiliteit</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Luggage trailer",
        description: (
          <>
            <p className="mb-4">
              Luggage trailers are compact and enclosed trailers, perfect for
              vacations, camping trips, or extra storage during moves. They are
              easy to couple and relatively lightweight.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Lightweight</strong>: suitable for smaller cars
              </li>
              <li>
                <strong>Enclosed space</strong>: protects against theft and rain
              </li>
              <li>
                <strong>Easy to use</strong>: no special driving experience
                needed
              </li>
              <li>
                <strong>License</strong>: category B license sufficient
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Maximum permitted speed may vary</li>
              <li>Check tire pressure and nose weight</li>
              <li>Place heavy items at bottom for stability</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Gepäckanhänger",
        description: (
          <>
            <p className="mb-4">
              Gepäckanhänger sind kompakte und geschlossene Anhänger, perfekt
              für Urlaube, Campingausflüge oder zusätzlichen Stauraum bei
              Umzügen. Sie sind einfach anzukuppeln und relativ leicht.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Leichtgewicht</strong>: geeignet für kleinere Autos
              </li>
              <li>
                <strong>Geschlossener Raum</strong>: schützt vor Diebstahl und
                Regen
              </li>
              <li>
                <strong>Einfache Verwendung</strong>: keine besondere
                Fahrerfahrung nötig
              </li>
              <li>
                <strong>Führerschein</strong>: Führerschein B ausreichend
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Maximal zulässige Geschwindigkeit kann variieren</li>
              <li>Reifendruck und Stützlast kontrollieren</li>
              <li>Schwere Gegenstände unten platzieren für Stabilität</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "36a45fa9-d24b-4154-afb6-e4abd7732576",
    icon: <FoodTrailer />,
    translations: {
      nl: {
        type: "Verkoopwagen",
        description: (
          <>
            <p className="mb-4">
              Verkoopwagens zijn aanhangers ingericht als mobiele verkooppunten,
              zoals foodtrucks, marktkramen of promotiestands. Ze zijn vaak
              voorzien van elektriciteit, uitklapbare zijdes of toonbanken.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Functioneel ingericht</strong>: voor horeca, promotie of
                verkoop
              </li>
              <li>
                <strong>Elektrische aansluiting</strong>: voor koeling of
                apparatuur
              </li>
              <li>
                <strong>Presentatie</strong>: vaak voorzien van luifel of
                toonbank
              </li>
              <li>
                <strong>Rijbewijs</strong>: BE bij zware uitvoeringen
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer inrichting op veiligheid (gas, stroom)</li>
              <li>Let op vergunningseisen op locatie</li>
              <li>Zorg voor stevige steunpoten bij gebruik op locatie</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Sales trailer",
        description: (
          <>
            <p className="mb-4">
              Sales trailers are trailers equipped as mobile sales points, such
              as food trucks, market stalls, or promotional stands. They are
              often equipped with electricity, fold-out sides, or counters.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Functionally equipped</strong>: for catering, promotion,
                or sales
              </li>
              <li>
                <strong>Electrical connection</strong>: for cooling or equipment
              </li>
              <li>
                <strong>Presentation</strong>: often equipped with awning or
                counter
              </li>
              <li>
                <strong>License</strong>: BE for heavy versions
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check equipment for safety (gas, electricity)</li>
              <li>Pay attention to permit requirements at location</li>
              <li>Ensure sturdy support legs when used on location</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Verkaufsanhänger",
        description: (
          <>
            <p className="mb-4">
              Verkaufsanhänger sind als mobile Verkaufsstellen eingerichtete
              Anhänger, wie Foodtrucks, Marktstände oder Promotionstände. Sie
              sind oft mit Strom, ausklappbaren Seiten oder Verkaufstheken
              ausgestattet.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Funktional eingerichtet</strong>: für Gastronomie,
                Promotion oder Verkauf
              </li>
              <li>
                <strong>Stromanschluss</strong>: für Kühlung oder Geräte
              </li>
              <li>
                <strong>Präsentation</strong>: oft mit Markise oder
                Verkaufstheke
              </li>
              <li>
                <strong>Führerschein</strong>: BE bei schweren Ausführungen
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Einrichtung auf Sicherheit prüfen (Gas, Strom)</li>
              <li>Auf Genehmigungsanforderungen am Standort achten</li>
              <li>Für stabile Stützfüße bei Standortnutzung sorgen</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "2add4c15-b238-4132-9e29-c356abc3f595",
    icon: <BicycleTrailer />,
    translations: {
      nl: {
        type: "Fietsen aanhanger",
        description: (
          <>
            <p className="mb-4">
              Fietsen aanhangers zijn ontworpen voor het vervoeren van meerdere
              fietsen, vaak met gootprofielen en bevestigingsbeugels. Ideaal
              voor fietsuitjes of sportevenementen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Gootprofielen</strong>: stabiele plaatsing van fietsen
              </li>
              <li>
                <strong>Vastzetten</strong>: voorkom schade met zachte
                spanbanden
              </li>
              <li>
                <strong>Toegang</strong>: let op hoogte van de laadconstructie
              </li>
              <li>
                <strong>Rijbewijs</strong>: meestal B, controleer aantal fietsen
                & gewicht
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer wielbevestigingen voor vertrek</li>
              <li>Dek fietsen af bij slecht weer</li>
              <li>
                Niet geschikt voor scooters of e-bikes zonder bevestigingspunt
              </li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Bicycle trailer",
        description: (
          <>
            <p className="mb-4">
              Bicycle trailers are designed for transporting multiple bicycles,
              often with rail profiles and mounting brackets. Ideal for cycling
              trips or sporting events.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Rail profiles</strong>: stable positioning of bicycles
              </li>
              <li>
                <strong>Securing</strong>: prevent damage with soft tie-down
                straps
              </li>
              <li>
                <strong>Access</strong>: pay attention to height of loading
                structure
              </li>
              <li>
                <strong>License</strong>: usually B, check number of bikes &
                weight
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check wheel attachments before departure</li>
              <li>Cover bicycles in bad weather</li>
              <li>
                Not suitable for scooters or e-bikes without mounting point
              </li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Fahrradanhänger",
        description: (
          <>
            <p className="mb-4">
              Fahrradanhänger sind für den Transport mehrerer Fahrräder
              konzipiert, oft mit Schienenprofilen und Befestigungsbügeln. Ideal
              für Radtouren oder Sportveranstaltungen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Schienenprofile</strong>: stabile Positionierung von
                Fahrrädern
              </li>
              <li>
                <strong>Befestigung</strong>: Schäden mit weichen Spanngurten
                vermeiden
              </li>
              <li>
                <strong>Zugang</strong>: auf Höhe der Ladekonstruktion achten
              </li>
              <li>
                <strong>Führerschein</strong>: meist B, Anzahl Räder & Gewicht
                prüfen
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Radbefestigungen vor Abfahrt kontrollieren</li>
              <li>Fahrräder bei schlechtem Wetter abdecken</li>
              <li>
                Nicht geeignet für Roller oder E-Bikes ohne Befestigungspunkt
              </li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "182a4555-b40d-4da8-b9ad-aa6e9ffba5ae",
    icon: <DrawBarTrailer />,
    translations: {
      nl: {
        type: "Schamel aanhanger",
        description: (
          <>
            <p className="mb-4">
              Een schamelaanhanger is voorzien van een draaibare dissel en wordt
              vaak gebruikt bij lange of zware transporten, zoals boomstammen of
              buizen. Door de scharnierende as is deze wendbaarder in bochten.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Draaibare dissel</strong>: vergemakkelijkt bochtenwerk
              </li>
              <li>
                <strong>Langwerpige lading</strong>: ideaal voor buizen, palen
                of hout
              </li>
              <li>
                <strong>Meestal zwaarder</strong>: professionele toepassing
              </li>
              <li>
                <strong>Rijbewijs</strong>: BE verplicht
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Let goed op de draaicirkel bij het manoeuvreren</li>
              <li>Controleer koppeling en remwerking extra goed</li>
              <li>Niet geschikt voor beginners</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Drawbar trailer",
        description: (
          <>
            <p className="mb-4">
              A drawbar trailer is equipped with a pivoting drawbar and is often
              used for long or heavy transports, such as tree trunks or pipes.
              The articulated axle makes it more maneuverable in turns.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Pivoting drawbar</strong>: facilitates cornering
              </li>
              <li>
                <strong>Elongated loads</strong>: ideal for pipes, poles, or
                timber
              </li>
              <li>
                <strong>Usually heavier</strong>: professional application
              </li>
              <li>
                <strong>License</strong>: BE required
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Pay close attention to turning circle when maneuvering</li>
              <li>Check coupling and braking performance extra carefully</li>
              <li>Not suitable for beginners</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Drehschemelanhänger",
        description: (
          <>
            <p className="mb-4">
              Ein Drehschemelanhänger ist mit einer drehbaren Deichsel
              ausgestattet und wird oft für lange oder schwere Transporte wie
              Baumstämme oder Rohre verwendet. Durch die gelenkige Achse ist er
              wendiger in Kurven.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Drehbare Deichsel</strong>: erleichtert Kurvenfahrt
              </li>
              <li>
                <strong>Langgestreckte Ladung</strong>: ideal für Rohre, Stangen
                oder Holz
              </li>
              <li>
                <strong>Meist schwerer</strong>: professionelle Anwendung
              </li>
              <li>
                <strong>Führerschein</strong>: BE erforderlich
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Beim Rangieren besonders auf Wendekreis achten</li>
              <li>Kupplung und Bremsleistung extra sorgfältig prüfen</li>
              <li>Nicht für Anfänger geeignet</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "f7b0c09b-6cb6-4d31-bfbc-2496a29a9c0d",
    icon: <PlateauTrailerDouble />,
    translations: {
      nl: {
        type: "Plateauwagen",
        description: (
          <>
            <p className="mb-4">
              Plateauwagens hebben een laadvloer boven de wielen waardoor ze aan
              alle zijden toegankelijk zijn. Ideaal voor het vervoeren van grote
              of brede objecten zoals bouwmateriaal of pallets.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Laadvloer boven wielen</strong>: extra breed laadvlak
              </li>
              <li>
                <strong>Neerklapbare zijborden</strong>: laden van alle kanten
                mogelijk
              </li>
              <li>
                <strong>Veelzijdig</strong>: veel gebruikt in de bouw
              </li>
              <li>
                <strong>Rijbewijs</strong>: BE bij zwaardere uitvoering
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Controleer vergrendeling van zijborden voor vertrek</li>
              <li>Zorg voor symmetrische belading</li>
              <li>Gebruik voldoende spanbanden</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Platform trailer",
        description: (
          <>
            <p className="mb-4">
              Platform trailers have a loading floor above the wheels making
              them accessible from all sides. Ideal for transporting large or
              wide objects such as construction materials or pallets.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Loading floor above wheels</strong>: extra wide loading
                platform
              </li>
              <li>
                <strong>Drop-down side boards</strong>: loading from all sides
                possible
              </li>
              <li>
                <strong>Versatile</strong>: widely used in construction
              </li>
              <li>
                <strong>License</strong>: BE for heavier versions
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Check locking of side boards before departure</li>
              <li>Ensure symmetrical loading</li>
              <li>Use sufficient tie-down straps</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Pritschenwagen",
        description: (
          <>
            <p className="mb-4">
              Pritschenwagen haben eine Ladefläche über den Rädern, wodurch sie
              von allen Seiten zugänglich sind. Ideal für den Transport großer
              oder breiter Objekte wie Baumaterialien oder Paletten.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Ladefläche über Rädern</strong>: extra breite Ladefläche
              </li>
              <li>
                <strong>Herunterklappbare Seitenborde</strong>: Laden von allen
                Seiten möglich
              </li>
              <li>
                <strong>Vielseitig</strong>: viel im Bauwesen verwendet
              </li>
              <li>
                <strong>Führerschein</strong>: BE bei schwererer Ausführung
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Verriegelung der Seitenborde vor Abfahrt prüfen</li>
              <li>Für symmetrische Beladung sorgen</li>
              <li>Ausreichend Spanngurte verwenden</li>
            </ul>
          </>
        ),
      },
    },
  },
  {
    id: "8cf25620-4f58-4c5d-b4dd-5bca062c3b91",
    icon: <Hitch />,
    translations: {
      nl: {
        type: "Overig",
        description: (
          <>
            <p className="mb-4">
              Deze categorie is bedoeld voor aanhangers die niet direct in een
              van de standaard types vallen. Denk aan speciale constructies,
              eigenbouw trailers of nichetoepassingen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Kenmerken &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Niet-standaard</strong>: bijzondere uitvoering of
                gebruik
              </li>
              <li>
                <strong>Controle</strong>: zorg voor geldige keuring en
                registratie
              </li>
              <li>
                <strong>Toepassing-specifiek</strong>: vraag na of gebruik is
                toegestaan
              </li>
              <li>
                <strong>Rijbewijs</strong>: afhankelijk van MTM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Algemene informatie:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Let op wettelijke eisen voor maatwerktrailers</li>
              <li>Controleer verlichting, reflectoren en koppeling</li>
              <li>Vraag indien nodig hulp bij laden/lossen</li>
            </ul>
          </>
        ),
      },
      en: {
        type: "Other",
        description: (
          <>
            <p className="mb-4">
              This category is intended for trailers that do not directly fall
              into one of the standard types. Think of special constructions,
              custom-built trailers, or niche applications.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Features &amp; tips:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Non-standard</strong>: special design or use
              </li>
              <li>
                <strong>Inspection</strong>: ensure valid inspection and
                registration
              </li>
              <li>
                <strong>Application-specific</strong>: check if use is permitted
              </li>
              <li>
                <strong>License</strong>: depends on MAM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">General information:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Pay attention to legal requirements for custom trailers</li>
              <li>Check lighting, reflectors, and coupling</li>
              <li>Ask for help with loading/unloading if needed</li>
            </ul>
          </>
        ),
      },
      de: {
        type: "Sonstige",
        description: (
          <>
            <p className="mb-4">
              Diese Kategorie ist für Anhänger gedacht, die nicht direkt in
              einen der Standardtypen fallen. Denken Sie an
              Sonderkonstruktionen, Eigenbauten oder Nischenanwendungen.
            </p>
            <h4 className="mt-6 mb-2 font-medium">Merkmale &amp; Tipps:</h4>
            <ul className="list-disc ml-5 space-y-1 mb-4">
              <li>
                <strong>Nicht-Standard</strong>: besondere Ausführung oder
                Verwendung
              </li>
              <li>
                <strong>Kontrolle</strong>: gültige Prüfung und Zulassung
                sicherstellen
              </li>
              <li>
                <strong>Anwendungsspezifisch</strong>: prüfen, ob Verwendung
                erlaubt ist
              </li>
              <li>
                <strong>Führerschein</strong>: abhängig von zGM
              </li>
            </ul>
            <h4 className="mt-6 mb-2 font-medium">Allgemeine Informationen:</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>Auf gesetzliche Anforderungen für Maßanfertigungen achten</li>
              <li>Beleuchtung, Reflektoren und Kupplung prüfen</li>
              <li>Bei Bedarf Hilfe beim Be-/Entladen anfordern</li>
            </ul>
          </>
        ),
      },
    },
  },
];

// Helper function to get trailer type by language
export const getTrailerType = (id, language = "nl") => {
  const trailer = trailerTypes.find((t) => t.id === id);
  return trailer ? trailer.translations[language] : null;
};

// Helper function to get all trailer types for a specific language
export const getTrailerTypesByLanguage = (language = "nl") => {
  return trailerTypes.map((trailer) => ({
    id: trailer.id,
    icon: trailer.icon,
    ...trailer.translations[language],
  }));
};

// Helper function to get available languages
export const getAvailableLanguages = () => {
  return ["nl", "en", "de"];
};
