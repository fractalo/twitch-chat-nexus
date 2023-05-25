import type {LanguageDetectorModule} from "i18next";
import Cookies from "js-cookie";

export const createLanguageDetector = (browserUILang?: string | null) => {
    return {
        type: 'languageDetector',
        detect() {
            const language = Cookies.get('language') ?? Cookies.get('PREF')?.split('hl=')[1]?.split('&')[0];
    
            return language || browserUILang || window?.navigator?.language;
        }
    } satisfies LanguageDetectorModule;
};