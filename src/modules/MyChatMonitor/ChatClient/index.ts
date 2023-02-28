const IRC_HOST = "irc-ws.chat.twitch.tv";
const NativeWebSocket = window.WebSocket;

const sendingListeners: any[] = [];
const receivingListeners: any[] = [];

const hookChatWebSocket = (chatWebSocket: WebSocket) => {
    const nativeSend = chatWebSocket.send.bind(chatWebSocket);
    const newSend = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        console.log(Date.now(), data);
        nativeSend(data);
    };
    chatWebSocket.send = newSend.bind(chatWebSocket);

    chatWebSocket.addEventListener('message', (event) => {
        if (typeof event.data === 'string') {
            event.data.includes(' USERSTATE ') && console.log(Date.now(), event.data);
        }
    });

    chatWebSocket.addEventListener('close', () => {

    });

    chatWebSocket.addEventListener('error', () => {

    });
}

const isChatWebSocketUrl = (url: string | URL) => {
    try {
        return new URL(url).host === IRC_HOST;
    } catch (error) {
        return false;
    }
}

window.WebSocket = class extends NativeWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        
        if (isChatWebSocketUrl(url)) {
            hookChatWebSocket(this);
        }
    }
};

const chatClient = {

}

export default chatClient;