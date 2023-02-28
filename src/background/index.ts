// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966#main-world-scripts

/* @ts-ignore */
import contentScriptUrl from "src/content?script"; 
/* @ts-ignore */
import myChatMonitorScriptUrl from "src/modules/MyChatMonitor?script&module";



chrome.scripting.registerContentScripts([
    {
      id: "contentScript",
      js: [contentScriptUrl],
      matches: ["https://www.twitch.tv/*"],
      runAt: "document_start",
      allFrames: true,
      world: "ISOLATED"
    },
    {
      id: "websocketHook",
      js: [myChatMonitorScriptUrl],
      matches: ["https://www.twitch.tv/*"],
      runAt: "document_start",
      allFrames: true,
      world: "MAIN",
    },
]);


chrome.runtime.onInstalled.addListener(() => {
    
});


