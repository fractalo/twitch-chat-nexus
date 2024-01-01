import type { ClientGetters } from "./injected/interceptor/clients";


declare global {
    interface Window {
        __TCN_preloaded?: {
            clients?: Readonly<ClientGetters>
        }
    }
}