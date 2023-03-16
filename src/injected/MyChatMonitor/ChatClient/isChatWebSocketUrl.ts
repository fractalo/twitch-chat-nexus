const IRC_HOST = "irc-ws.chat.twitch.tv";


export const isChatWebSocketUrl = (url: string | URL) => {
    try {
        return new URL(url).host === IRC_HOST;
    } catch (error) {
        return false;
    }
}