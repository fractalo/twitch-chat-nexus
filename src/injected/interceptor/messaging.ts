import { Messaging, SCRIPT_IDS } from "src/messaging";


const messaging = new Messaging(SCRIPT_IDS.INJECTED_INTERCEPTOR);

messaging.on('message', (message) => {
    if (message.from !== SCRIPT_IDS.CONTENT) return;

    switch (message.type) {
        default:
    }
});

export default messaging;