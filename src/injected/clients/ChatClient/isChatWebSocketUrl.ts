import { IRC_HOST } from "./constants";

export const isChatWebSocketUrl = (url: string | URL) => {
    try {
        return new URL(url).host === IRC_HOST;
    } catch (error) {
        return false;
    }
}