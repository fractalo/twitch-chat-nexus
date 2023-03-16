chrome.scripting.registerContentScripts([
    {
        id: "mtc_injectedScript",
        js: ['injected.js'],
        matches: ["https://www.twitch.tv/*"],
        runAt: "document_start",
        allFrames: true,
        world: "MAIN",
    },
]);


chrome.runtime.onInstalled.addListener(() => {
    
});


export {}