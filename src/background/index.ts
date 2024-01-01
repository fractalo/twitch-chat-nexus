
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
    
});


export {}