import nlCommon from '../../../../public/locales/nl/common.json';
import nlHome from '../../../../public/locales/nl/home.json';
import nlTrailer from '../../../../public/locales/nl/trailer.json';
import nlAuth from '../../../../public/locales/nl/auth.json';
import nlProfile from '../../../../public/locales/nl/profile.json';
import nlReservation from '../../../../public/locales/nl/reservation.json';
import nlAddTrailer from '../../../../public/locales/nl/addTrailer.json';
import nlTrailerTypes from '../../../../public/locales/nl/trailerTypes.json';

// English translations
import enCommon from '../../../../public/locales/en/common.json';
import enHome from '../../../../public/locales/en/home.json';
import enTrailer from '../../../../public/locales/en/trailer.json';
import enAuth from '../../../../public/locales/en/auth.json';
import enProfile from '../../../../public/locales/en/profile.json';
import enReservation from '../../../../public/locales/en/reservation.json';
import enAddTrailer from '../../../../public/locales/en/addTrailer.json';
import enTrailerTypes from '../../../../public/locales/en/trailerTypes.json';

// German translations
import deCommon from '../../../../public/locales/de/common.json';
import deHome from '../../../../public/locales/de/home.json';
import deTrailer from '../../../../public/locales/de/trailer.json';
import deAuth from '../../../../public/locales/de/auth.json';
import deProfile from '../../../../public/locales/de/profile.json';
import deReservation from '../../../../public/locales/de/reservation.json';
import deAddTrailer from '../../../../public/locales/de/addTrailer.json';
import deTrailerTypes from '../../../../public/locales/de/trailerTypes.json';


export const bundledTranslations = {
  nl: {
    common: nlCommon,
    home: nlHome,
    trailer: nlTrailer,
    auth: nlAuth,
    profile: nlProfile,
    reservation: nlReservation,
    addTrailer: nlAddTrailer,
    trailerTypes: nlTrailerTypes,
  },
  en: {
    common: enCommon,
    home: enHome,
    trailer: enTrailer,
    auth: enAuth,
    profile: enProfile,
    reservation: enReservation,
    addTrailer: enAddTrailer,
    trailerTypes: enTrailerTypes,
  },
  de: {
    common: deCommon,
    home: deHome,
    trailer: deTrailer,
    auth: deAuth,
    profile: deProfile,
    reservation: deReservation,
    addTrailer: deAddTrailer,
    trailerTypes: deTrailerTypes,
  },
} as const;