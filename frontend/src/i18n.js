import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import thTranslations from './locales/th.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      th: {
        translation: thTranslations
      }
    },
    lng: localStorage.getItem('language') || 'th', // Default to Thai
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
