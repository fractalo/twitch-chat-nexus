import { ScriptIds } from "src/constants/scripts";
import { updateConfig } from "./ChatLogWindowOpeningButton";
import messaging from "src/injected/messaging";
import { i18nMessageStore } from "./store";
import { settingValuesStore } from "src/injected/store";


(() => {
    messaging.waitForConnected(ScriptIds.content)
    .then(() => {
        messaging.postMessage({
            type: "GET_I18N_MESSAGES",
            content: [
                "chatLogView_openingButton",
                "chatLogView_openingButton_label",
            ]
        }, (response) => {
            if (response.type !== 'I18N_MESSAGES') return;
            i18nMessageStore.set({
                openingButton: response.content.chatLogView_openingButton,
                openingButtonLabel: response.content.chatLogView_openingButton_label,
            });
        });
    });

    settingValuesStore.subscribe((settingValues) => {
        settingValues && updateConfig(settingValues);
    })
    
})();
