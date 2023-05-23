import { API_URL } from "./constants";

const apiUrl = new URL(API_URL);

export const isTwitchGqlRequest = (request: Request) => {
    try {
        const url = new URL(request.url);
        return url.origin === apiUrl.origin && 
            url.pathname === apiUrl.pathname && 
            request.method === 'POST';
    } catch (error) {
        return false;
    }
}