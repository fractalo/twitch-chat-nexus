import { Messaging } from "src/components/Messaging"
import { ScriptIds } from "src/constants/scripts";


const messaging = new Messaging(ScriptIds.INJECTED_INTERCEPTOR);

messaging.on('message', (message) => {
    if (message.from !== ScriptIds.CONTENT) return;

    switch (message.type) {
        case 'SETTINGS': {
            
            break;
        }
        default:
    }
});

export default messaging;