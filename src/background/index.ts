import { setupDefaultChatFilters } from "./storageInitializers";

/**
 * to bypass async loader of crxjs
 * https://github.com/crxjs/chrome-extension-tools/issues/391
 */
const registerInterceptor = async() => {
    const script: chrome.scripting.RegisteredContentScript = {
        id: "tcn_early_injector",
        js: ['scripts/interceptor.js'],
        matches: ["*://*.twitch.tv/*"],
        excludeMatches: ["*://gql.twitch.tv/*", "*://passport.twitch.tv/*"],
        runAt: "document_start",
        allFrames: false,
        world: "MAIN",
    };

    const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [script.id] });
    const saveScript = () => registered.length
        ? chrome.scripting.updateContentScripts([script])
        : chrome.scripting.registerContentScripts([script]);

    try {
        await saveScript();
    } catch (error) {
        if (import.meta.env.VITE_BROWSER !== 'firefox') throw error;

        // Firefox before 128 does not support the MAIN execution world.
        console.warn('[TCN] MAIN world registration failed; using earlyInjector', error);
        script.js = ['earlyInjector.js'];
        delete script.world;
        await saveScript();
    }
};

registerInterceptor().catch(console.error);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) {
        return;
    }

    if (message === 'OPEN_OPTIONS_PAGE') {
        chrome.runtime.openOptionsPage();
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        setupDefaultChatFilters();
    } else if (details.reason === 'update') {
        const previousMajorVersion = Number(details.previousVersion?.split('.')[0]);
        const currentMajorVersion = Number(chrome.runtime.getManifest().version.split('.')[0]);

        if (previousMajorVersion < 2 && currentMajorVersion >= 2) {
            setupDefaultChatFilters();
        }
    }
});

