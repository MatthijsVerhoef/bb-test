export const metadata = {
  title: "Privacyverklaring | BuurBak",
  description: "Privacyverklaring van BuurBak, het platform voor de verhuur van aanhangers."
};

export default function Privacy() {
  return (
    <div className="py-20">

      <div className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Privacyverklaring BuurBak</h1>

        <p className="mb-4">Laatst bijgewerkt: 24 juni 2025</p>

        <p className="mb-4">
          Via het platform <strong>BuurBak</strong> bemiddelen wij bij de
          verhuur van aanhangers. Hierbij verwerken wij persoonsgegevens. Wij
          vinden jouw privacy belangrijk en gaan zorgvuldig om met je gegevens.
          In deze privacyverklaring leggen wij uit welke persoonsgegevens wij
          verzamelen, waarom we dat doen en welke rechten jij hebt.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Wie zijn wij?</h2>
        <p className="mb-4">
          <strong>BuurBak</strong>
          <br />
          Vennootschap Onder Firma
          <br />
          KVK-nummer: 89485742
          <br />
          Vestigingsnummer: 000055277810
          <br />
          Haverweerd 52, 3762BK Soest
          <br />
          E-mail:{" "}
          <a
            href="mailto:support@buurbak.nl"
            className="text-primary underline"
          >
            support@buurbak.nl
          </a>
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          2. Welke persoonsgegevens verwerken wij?
        </h2>
        <ul className="list-disc list-inside mb-4">
          <li>Voor- en achternaam</li>
          <li>Adresgegevens</li>
          <li>E-mailadres</li>
          <li>Telefoonnummer</li>
          <li>Locatiegegevens</li>
          <li>Gegevens over gehuurde of verhuurde trailers</li>
          <li>Foto’s van aanhangers</li>
          <li>Reviews en beoordelingen</li>
          <li>Rijbewijsnummer en geldig tot datum (encrypted opgeslagen)</li>
          <li>
            Betaalgegevens (verwerking via Stripe, beperkte informatie
            zichtbaar)
          </li>
        </ul>
        <p className="mb-4">
          Daarnaast verzamelen wij automatisch gegevens via cookies. Zie punt 7.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          3. Waarom verwerken wij persoonsgegevens?
        </h2>
        <ul className="list-disc list-inside mb-4">
          <li>Het aanmaken en beheren van een account</li>
          <li>Het afhandelen van verhuurtransacties</li>
          <li>Verwerking van betalingen via Stripe</li>
          <li>Verificatie van identiteit en rijbewijs</li>
          <li>Contact opnemen over boekingen</li>
          <li>Beveiliging van het platform</li>
          <li>Voldoen aan wettelijke verplichtingen</li>
          <li>
            Verzenden van nieuwsbrieven en promoties (uitschrijven is mogelijk)
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          4. Delen van gegevens met derden
        </h2>
        <p className="mb-4">
          Wij delen persoonsgegevens uitsluitend wanneer dat noodzakelijk is of
          wettelijk verplicht:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Stripe (betalingsverwerking)</li>
          <li>
            Cloudflare (beveiliging en performance, mogelijk verwerking buiten
            de EU)
          </li>
          <li>Hostingpartij van de website</li>
          <li>Eventuele verzekeringsmaatschappijen bij schadeafhandeling</li>
        </ul>
        <p className="mb-4">Wij verkopen nooit persoonsgegevens aan derden.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Bewaartermijn</h2>
        <p className="mb-4">
          Wij bewaren persoonsgegevens niet langer dan noodzakelijk:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>
            Accountgegevens: zolang je account actief is, daarna maximaal 2 jaar
          </li>
          <li>Verhuurgegevens: 7 jaar (wettelijke bewaartermijn)</li>
          <li>
            Rijbewijsgegevens: maximaal 1 maand na afloop van de huurperiode
          </li>
          <li>Marketinggegevens: tot je je afmeldt</li>
          <li>Cookies: zie punt 7</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Beveiliging</h2>
        <p className="mb-4">
          Wij nemen passende beveiligingsmaatregelen om jouw gegevens te
          beschermen:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>SSL-versleuteling</li>
          <li>Beveiligde servers</li>
          <li>Toegangscontrole binnen systemen</li>
          <li>Encryptie van gevoelige gegevens (zoals rijbewijsinformatie)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          7. Cookies en tracking
        </h2>
        <p className="mb-4">
          Wij gebruiken cookies voor verschillende doeleinden:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>
            <strong>Noodzakelijke cookies:</strong> voor een goed werkende
            website
          </li>
          <li>
            <strong>Analytische cookies:</strong> met Google Analytics
            (IP-adressen geanonimiseerd)
          </li>
          <li>
            <strong>Trackingcookies:</strong> voor advertenties en
            gepersonaliseerde content (alleen met toestemming)
          </li>
        </ul>
        <p className="mb-4">
          Bij je eerste bezoek vragen wij toestemming voor niet-noodzakelijke
          cookies. Je kunt je voorkeuren altijd aanpassen.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Jouw rechten</h2>
        <p className="mb-4">Je hebt het recht op:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Inzage in je gegevens</li>
          <li>Correctie van je gegevens</li>
          <li>Verwijdering van je gegevens</li>
          <li>Bezwaar maken tegen verwerking</li>
          <li>Overdracht van je gegevens</li>
          <li>Intrekken van toestemming</li>
        </ul>
        <p className="mb-4">
          Je kunt een verzoek indienen via{" "}
          <a
            href="mailto:support@buurbak.nl"
            className="text-primary underline"
          >
            support@buurbak.nl
          </a>
          . Wij reageren binnen 30 dagen.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Klachten</h2>
        <p className="mb-4">
          Ben je niet tevreden over hoe wij met je gegevens omgaan? Je kunt een
          klacht indienen bij de{" "}
          <a
            href="https://www.autoriteitpersoonsgegevens.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Autoriteit Persoonsgegevens
          </a>
          .
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Wijzigingen</h2>
        <p className="mb-4">
          Wij behouden ons het recht voor om deze privacyverklaring te wijzigen.
          Raadpleeg deze pagina regelmatig voor de meest actuele versie.
        </p>
      </div>
    </div>
  );
}
