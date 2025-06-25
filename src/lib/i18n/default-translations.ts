// Default translations to prevent flash of untranslated content
export const defaultTranslations = {
  common: {
    header: {
      addTrailer: "Aanhanger plaatsen",
      profile: "Profiel",
      chat: "Berichten",
      logout: "Uitloggen",
      login: "Inloggen",
      register: "Registreren"
    }
  },
  addTrailer: {
    title: "Aanhanger toevoegen",
    description: "Vul de gegevens van je aanhanger in om deze te kunnen verhuren.",
    errors: {
      requiredFields: "Vul alle verplichte velden in om door te gaan",
      acceptTerms: "Je moet akkoord gaan met de voorwaarden",
      defaultError: "Er is een fout opgetreden",
      submissionError: "Er is een fout opgetreden bij het plaatsen van de aanhanger"
    },
    sections: {
      type: {
        title: "Type aanhanger",
        description: "Selecteer het type aanhanger dat je wilt verhuren. Dit helpt huurders de juiste aanhanger te vinden.",
        customType: "Typ het type aanhanger",
        customTypePlaceholder: "Bijv. vlakzeil aanhanger"
      },
      details: {
        title: "Afmetingen",
        description: "Vul de afmetingen in zodat huurders weten of de aanhanger past bij hun behoeften.",
        length: "Lengte (cm)",
        width: "Breedte (cm)",
        height: "Hoogte (cm)",
        weight: "Gewicht (kg)",
        capacity: "Max. last (kg)"
      },
      location: {
        title: "Locatie",
        description: "Waar kunnen huurders je aanhanger ophalen?",
        address: "Adres",
        addressPlaceholder: "Straat en huisnummer",
        postalCode: "Postcode",
        postalCodePlaceholder: "1234 AB",
        city: "Plaats",
        cityPlaceholder: "Amsterdam",
        privacy: "Het volledige adres wordt alleen getoond aan huurders na bevestiging van de boeking. In zoekresultaten wordt alleen je stad of postcode weergegeven."
      }
    },
    common: {
      saveAndContinue: "Opslaan en verder",
      saving: "Opslaan...",
      saveAsConcept: "Opslaan als concept"
    }
  },
  home: {
    hero: {
      title: "Huur een aanhanger in jouw buurt",
      subtitle: "Vind de perfecte aanhanger voor jouw klus bij particulieren in de buurt",
      searchPlaceholder: "Zoek een aanhanger",
      addDates: "Datums toevoegen",
      searchButton: "Zoeken"
    },
    cityTitle: {
      rentTrailerIn: "Aanhanger huren in"
    },
    sortBy: {
      label: "Sorteer op",
      options: {
        default: "Standaard",
        priceLowToHigh: "Prijs: laag naar hoog",
        priceHighToLow: "Prijs: hoog naar laag",
        rating: "Beoordeling",
        distance: "Afstand"
      }
    },
    activeFilters: {
      none: "0 Actieve filters",
      single: "1 Actieve filter",
      multiple: "Actieve filters"
    },
    trailerCard: {
      perDay: "/ dag",
      unavailable: "Niet beschikbaar",
      removeFromFavorites: "Verwijder uit favorieten",
      addToFavorites: "Toevoegen aan favorieten"
    },
    quickSearch: {
      rentTrailerIn: "Huur jouw aanhanger in",
      searchLocation: "Locatie zoeken",
      addDates: "Datums toevoegen",
      wherePlaceholder: "Waar wil je een aanhanger huren?",
      searching: "Zoeken...",
      noLocationsFound: "Geen locaties gevonden",
      pickup: "Ophalen",
      return: "Terugbrengen"
    },
    filters: {
      title: "Filters",
      clearAll: "Alle filters wissen",
      pricePerDay: "Prijs per dag",
      trailerSize: "Aanhanger Grootte",
      trailerType: "Type aanhanger",
      accessories: "Accessoires",
      license: "Rijbewijs",
      dimensions: "Afmetingen",
      availability: "Beschikbaarheid",
      sizeOptions: {
        small: "Klein",
        medium: "Gemiddeld",
        large: "Groot"
      },
      showMore: "Toon meer",
      showLess: "Toon minder",
      more: "meer",
      licenseOptions: {
        none: "Geen Rijbewijs Verplichting",
        B: "BE Rijbewijs",
        BE: "B+ Rijbewijs"
      },
      dimensionLabels: {
        length: "Lengte",
        width: "Breedte",
        height: "Hoogte",
        cm: "cm"
      },
      dateRange: {
        selectDates: "Selecteer data",
        clearDates: "Datums wissen"
      },
      mobileDrawer: {
        filters: "Filters",
        apply: "Filters toepassen",
        reset: "Reset"
      }
    }
  }
};