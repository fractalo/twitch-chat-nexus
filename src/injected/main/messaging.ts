import { Messaging } from "src/components/Messaging"
import { ScriptIds } from "src/constants/scripts";
import { settingValuesStore } from "./stores";

const messaging = new Messaging(ScriptIds.INJECTED_MAIN);

messaging.on('message', (message) => {
    if (message.from !== ScriptIds.CONTENT) return;

    switch (message.type) {
        case 'SETTINGS': {
            settingValuesStore.set(message.content);
            break;
        }
        default:
    }
});

export default messaging;