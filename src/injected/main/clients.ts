import { ScriptIds } from "src/constants/scripts";
import messaging from "./messaging";
import type { ClientGetters } from "../interceptor/clients";


const clientGettersPromise = new Promise<ClientGetters>((resolve) => {
    if (window?.__TCH_preloaded?.clients) {
        resolve(window.__TCH_preloaded.clients);
        return;
    }
    const removeMessageListener = messaging.on('message', (message) => {
        if (
            message.from === ScriptIds.INJECTED_INTERCEPTOR &&
            message.type === 'LOADED' &&
            window?.__TCH_preloaded?.clients
        ) {
            removeMessageListener();
            resolve(window.__TCH_preloaded.clients);
        }
    });
});


export const getChatClient = async() => (await clientGettersPromise).getChatClient();
export const getGqlClient = async() => (await clientGettersPromise).getGqlClient();


