import { Messaging } from "src/components/Messaging"
import { ScriptIds } from "src/constants/scripts";
import { settingValuesStore } from "./store";

const messaging = new Messaging(ScriptIds.injected);

messaging.on('message', (message) => {
    if (message.from !== ScriptIds.content) return;

    switch (message.type) {
        case 'SETTINGS': {
            settingValuesStore.set(message.content);
            break;
        }
        default:
    }
});

export default messaging;