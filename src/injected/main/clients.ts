import { SCRIPT_IDS } from "src/messaging";
import messaging from "./messaging";
import type { ClientGetters } from "../interceptor/clients";


const clientGettersPromise = new Promise<ClientGetters>((resolve) => {
    if (window?.__TCN_preloaded?.clients) {
        resolve(window.__TCN_preloaded.clients);
        return;
    }
    const removeMessageListener = messaging.on('message', (message) => {
        if (
            message.from === SCRIPT_IDS.INJECTED_INTERCEPTOR &&
            message.type === 'LOADED' &&
            window?.__TCN_preloaded?.clients
        ) {
            removeMessageListener();
            resolve(window.__TCN_preloaded.clients);
        }
    });
});


export const getChatClient = async() => (await clientGettersPromise).getChatClient();
export const getGqlClient = async() => (await clientGettersPromise).getGqlClient();


