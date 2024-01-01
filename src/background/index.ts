import { setupDefaultChatFilters } from "./storageInitializers";

/**
 * to bypass async loader of crxjs
 * https://github.com/crxjs/chrome-extension-tools/issues/391
 */
chrome.scripting.registerContentScripts([
    {
        id: "tcn_early_injector",
        js: ['earlyInjector.js'],
        matches: ["*://*.twitch.tv/*"],
        runAt: "document_start",
        allFrames: true,
    }
]);

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

