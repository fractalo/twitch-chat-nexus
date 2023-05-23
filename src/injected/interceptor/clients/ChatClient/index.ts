import { createNanoEvents } from "nanoevents";
import type { Message } from "ircv3/lib";
import { parseMessage } from "./parseMessage";
import { isChatWebSocketUrl } from "./isChatWebSocketUrl";


interface Events {
    send: (message: Message<any>) => void;
    receive: (message: Message<any>) => void;
    create: () => void;
    ping: () => void;
    open: () => void;
}

export interface ChatClient {
    on<E extends keyof Events>(event: E, callback: Events[E]): void;
    isOpened(): boolean;
    sendPing(sendWithUUID?: boolean): void;
}

const createChatClient = (): ChatClient => {
    const emitter = createNanoEvents<Events>();
    let ircWebSocket: WebSocket | null = null;
    let currentLine = '';

    const setChatWebSocket = (webSocket: WebSocket) => {
        emitter.emit('create');

        const nativeSend = webSocket.send.bind(webSocket);
        const send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
            nativeSend(data);

            const message = parseMessage((data as Buffer).toString());
            if (message) {
                emitter.emit('send', message);
            } else if (data === 'PING') { // parser cannot parse native ping.
                emitter.emit('ping');
            }
        };
        webSocket.send = send.bind(webSocket);


        // https://github.com/d-fischer/connection/blob/main/src/AbstractConnection.ts
        const messageListener = ({data}: MessageEvent<any>) => {
            const receivedLines = (data as Buffer).toString().split('\r\n');
            currentLine += receivedLines.shift() ?? '';
            if (receivedLines.length) {
                const message = parseMessage(currentLine);
                message && emitter.emit('receive', message);

                currentLine = receivedLines.pop() ?? '';
                for (const line of receivedLines) {
                    const message = parseMessage(line);
                    message && emitter.emit('receive', message);
                }
            }
        };

        const openListener = () => {
            emitter.emit('open');
        };

        const closeListener = () => {
            webSocket.send = nativeSend;
            webSocket.removeEventListener('message', messageListener);
            webSocket.removeEventListener('open', openListener);
            webSocket.removeEventListener('close', closeListener);
        };

        webSocket.addEventListener('message', messageListener);
        webSocket.addEventListener('open', openListener);
        webSocket.addEventListener('close', closeListener);


        ircWebSocket = webSocket;
    };


    window.WebSocket = class extends WebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
            super(url, protocols);
            
            if (isChatWebSocketUrl(url)) {
                setChatWebSocket(this);
            }
        }
    };

    const on = <E extends keyof Events>(event: E, callback: Events[E]) => {
        return emitter.on(event, callback);
    };

    const isOpened = () => ircWebSocket?.readyState === WebSocket.OPEN;

    const sendPing = (sendWithUUID = false) => {
        if (!isOpened()) return;

        if (sendWithUUID) {
            ircWebSocket?.send(`PING :${crypto?.randomUUID()}`);
        } else {
            ircWebSocket?.send('PING');
        }
    };

    return { on, isOpened, sendPing };
};


let chatClient: ChatClient | undefined;

export const getChatClient = () => {
    if (!chatClient) {
        chatClient = createChatClient();
    }
    return chatClient;
};
