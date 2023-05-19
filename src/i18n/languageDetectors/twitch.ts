import type {LanguageDetectorModule} from "i18next";
import Cookies from "js-cookie";

export default {
    type: 'languageDetector',
    detect() {
        const language = Cookies.get('language') ?? Cookies.get('PREF')?.split('hl=')[1]?.split('&')[0];

        return language || chrome.i18n.getUILanguage();
    }
} satisfies LanguageDetectorModule;