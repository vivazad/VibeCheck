import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';

// Get URL lang parameter override
const getUrlLang = (): string | null => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('lang');
    }
    return null;
};

const urlLang = getUrlLang();

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            es: { translation: es },
        },
        // If URL has ?lang=XX, use that; otherwise auto-detect
        lng: urlLang || undefined,
        fallbackLng: 'en',
        supportedLngs: ['en', 'es'],

        detection: {
            // Order of detection: URL query param, navigator, localStorage
            order: ['querystring', 'navigator', 'localStorage'],
            lookupQuerystring: 'lang',
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false, // React already escapes
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;
