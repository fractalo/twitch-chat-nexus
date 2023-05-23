import './messaging';
import './routes';
import { initI18next } from "src/i18n";
import LanguageDetector from "src/i18n/languageDetectors/twitch";
import { waitForDOMReady } from 'src/util/waitForDOMReady';


/** initialize i18next */
initI18next(LanguageDetector);


/** load modules */
const modules = import.meta.glob('./modules/*/index.ts');

waitForDOMReady().then(() => {
    Object.keys(modules).forEach(path => modules[path]());
});
