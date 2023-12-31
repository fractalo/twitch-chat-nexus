import i18next, {type LanguageDetectorModule} from "i18next";
import resources from 'virtual:i18next-loader';
import { createI18nStore } from "svelte-i18next";

interface Config {
    languageDetector: LanguageDetectorModule;
    language?: string;
}

let didInitialization = false;

export const initI18next = (config: Config) => {
    if (didInitialization) {
        return i18next;
    }

    i18next
    .use(config.languageDetector)
    .init({
        resources,
        supportedLngs: ['en', 'ko'],
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
        lng: config.language
    });

    didInitialization = true;

    return i18next;
};

export const i18n = createI18nStore(i18next);
