import './MyChatLog';
import './MyChatMonitor';

import { scriptIds } from "src/constants/scripts";
import { Messaging } from "src/components/Messaging";




const SELF_ID = scriptIds.injectedScript;

const messaging = new Messaging(SELF_ID, [scriptIds.contentScript]);

messaging.on('connect', (id) => {
    // console.log(`[${SELF_ID}] connected with ${id}`);
});

messaging.on('message', (message) => {
    console.log(`[${SELF_ID}] received message:`, message);

    if (message.type === "SETTINGS") {

    }
});




