import type { ClientGetters } from "./injected/interceptor/clients";


declare global {
    interface Window {
        __TCH_preloaded?: {
            clients?: Readonly<ClientGetters>
        }
    }
}