import type {LanguageDetectorModule} from "i18next";

export default {
    type: 'languageDetector',
    detect() {
        return chrome.i18n.getUILanguage();
    }
} satisfies LanguageDetectorModule;