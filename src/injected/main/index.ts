import { ScriptIds } from 'src/constants/scripts';
import messaging from './messaging';
import './routes';
import { initI18next } from "src/i18n";
import { createLanguageDetector } from "src/i18n/languageDetectors/twitch";
import { waitForDOMReady } from 'src/util/waitForDOMReady';


(async() => {
    messaging.postMessage({ type: "GET_LANGUAGE" });
    const browserUILang = await messaging.waitForMessage<string>(ScriptIds.CONTENT, "LANGUAGE");

    /** initialize i18next */
    const languageDetector = createLanguageDetector(browserUILang);
    initI18next(languageDetector);

    /** load modules */
    const modules = import.meta.glob('./modules/*/index.ts');

    await waitForDOMReady();

    Object.keys(modules).forEach(path => modules[path]());

})();
