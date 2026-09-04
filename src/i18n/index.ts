import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

// A stored choice always wins, so anyone who has explicitly picked English keeps it.
// Only users who never chose get the new default.
const stored = localStorage.getItem('language') as 'en' | 'es' | null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: stored ?? 'es',
    // Both locales carry the same 367 keys, so this only matters for a key added to one
    // and not the other — in which case Spanish is the one to show.
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });

export default i18n;
