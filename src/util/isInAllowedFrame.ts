import { isInIframe } from "./isInIframe";

const NOT_ALLOWED_HOSTNAMES = [
    "gql.twitch.tv",
    "passport.twitch.tv",
];

export const isInAllowedFrame = (): boolean => {
    return !isInIframe() && 
            !NOT_ALLOWED_HOSTNAMES.includes(window.location.hostname);
};