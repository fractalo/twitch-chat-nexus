import { createNanoEvents, type Emitter } from "nanoevents";
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

class ChatClient {
    private emitter: Emitter;
    private webSocket: WebSocket | null;
    private currentLine: string;

    constructor() {
        this.emitter = createNanoEvents<Events>();
        this.webSocket = null;
        this.currentLine = '';

        const setChatWebSocket = this.setWebSocket.bind(this) as typeof this.setWebSocket;
        
        window.WebSocket = class extends WebSocket {
            constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols);
                
                if (isChatWebSocketUrl(url)) {
                    setChatWebSocket(this);
                }
            }
        };
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    isOpened() {
        return this.webSocket?.readyState === WebSocket.OPEN;
    }

    sendPing(sendWithUUID = false) {
        if (!this.isOpened()) return;

        if (sendWithUUID) {
            this.webSocket?.send(`PING :${crypto?.randomUUID()}`);
        } else {
            this.webSocket?.send('PING');
        }
    }

    private setWebSocket(webSocket: WebSocket) {
        this.emitter.emit('create');
        const nativeSend = webSocket.send.bind(webSocket);
        const send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
            nativeSend(data);

            const message = parseMessage((data as Buffer).toString());
            if (message) {
                this.emitter.emit('send', message);
            } else if (data === 'PING') { // parser cannot parse native ping.
                this.emitter.emit('ping');
            }
        };
        webSocket.send = send.bind(webSocket);


        // https://github.com/d-fischer/connection/blob/main/src/AbstractConnection.ts
        const messageListener = ({data}: MessageEvent<any>) => {
            const receivedLines = (data as Buffer).toString().split('\r\n');
            this.currentLine += receivedLines.shift() ?? '';
            if (receivedLines.length) {
                const message = parseMessage(this.currentLine);
                message && this.emitter.emit('receive', message);

                this.currentLine = receivedLines.pop() ?? '';
                for (const line of receivedLines) {
                    const message = parseMessage(line);
                    message && this.emitter.emit('receive', message);
                }
            }
        }

        const openListener = () => {
            this.emitter.emit('open');
        };

        const closeListener = () => {
            webSocket.send = nativeSend;
            webSocket.removeEventListener('message', messageListener);
            webSocket.removeEventListener('open', openListener);
            webSocket.removeEventListener('close', closeListener);
        }

        webSocket.addEventListener('message', messageListener);
        webSocket.addEventListener('open', openListener);
        webSocket.addEventListener('close', closeListener);


        this.webSocket = webSocket;
    }
}

let chatClient: ChatClient | undefined;

export const getChatClient = () => {
    if (!chatClient) {
        chatClient = new ChatClient();
    }
    return chatClient;
}
