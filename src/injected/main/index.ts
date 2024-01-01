import { SCRIPT_IDS } from 'src/messaging';
import messaging from './messaging';
import './routes';
import './stores';
import { initI18next } from "src/i18n";
import { createLanguageDetector } from "src/i18n/languageDetectors/twitch";
import { waitForDOMReady } from 'src/util/waitForDOMReady';


(async() => {
    await messaging.waitForConnected(SCRIPT_IDS.CONTENT);
    
    messaging.postMessage({ type: "GET_LANGUAGE" });
    const browserUILang = await messaging.waitForMessage<string>(SCRIPT_IDS.CONTENT, "LANGUAGE");

    /** initialize i18next */
    const languageDetector = createLanguageDetector(browserUILang);
    initI18next({ languageDetector });

    /** load modules */
    await waitForDOMReady();

    if (import.meta.env.DEV) {
        const modules = import.meta.glob('./modules/*/index.ts');
        Object.values(modules).forEach(module => module());
    } else {
        // to prevent dynamic import from being wrapped by vite preloader
        const modulePaths = import.meta.glob('./modules/*/index.ts', {
            query: { script: true, module: true }, 
            import: 'default', 
            eager: true
        });

        Object.values(modulePaths)
        .forEach(path => {
            try {
                if (typeof path !== 'string') {
                    throw new Error('module path is not string');
                }
                import(/* @vite-ignore */ path);
            } catch (err) {
                console.error(err);
            }
        });
    }

})();
