import i18next, {type LanguageDetectorModule} from "i18next";
import LanguageDetector from './languageDetectors/browser';
import resources from 'virtual:i18next-loader';
import { createI18nStore } from "svelte-i18next";


let didInitialization = false;

export const initI18next = (languageDetector: LanguageDetectorModule = LanguageDetector) => {
    if (didInitialization) {
        return i18next;
    }

    i18next
    .use(languageDetector)
    .init({
        resources,
        supportedLngs: ['en', 'ko'],
        fallbackLng: 'en',
        ns: ['common', 'translation', 'settings'],
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
    });

    didInitialization = true;

    return i18next;
};

export const i18n = createI18nStore(i18next);