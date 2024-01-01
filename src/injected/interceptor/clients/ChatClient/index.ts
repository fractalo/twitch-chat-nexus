import { createNanoEvents, type Unsubscribe } from "nanoevents";
import { parseMessage } from "./parseMessage";
import { isChatWebSocketUrl } from "./isChatWebSocketUrl";
import { MessageTypes, type Message, type MessageConstructor } from "ircv3"; 
import type { EventHandler } from "node_modules/ircv3/lib/IrcClient";
import { toUserName } from "@twurple/chat";


export interface Events {
    send: (message: Message<any>) => void;
    receive: (message: Message<any>) => void;
    create: () => void;
    ping: () => void;
    open: () => void;
    join: (channel: string) => void;
}

export interface ChatClient {
    on<E extends keyof Events>(event: E, callback: Events[E]): Unsubscribe;
    isOpened(): boolean;
    sendPing(sendWithUUID?: boolean): void;
}

type EventHandlers<T extends Message> = EventHandler<T>[];

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
            ircWebSocket?.send(`PING :${window.crypto?.randomUUID()}`);
        } else {
            ircWebSocket?.send('PING');
        }
    };

    const events = new Map<string, EventHandlers<any>>();

    const onTypedMessage = <T extends Message>(
        type: MessageConstructor<T>,
        handler: EventHandler<T>
    ) => {
        const handlers: EventHandlers<any> = events.get(type.COMMAND) || [];
        handlers.push(handler);
        events.set(type.COMMAND, handlers);
    };

    onTypedMessage(MessageTypes.Commands.ChannelJoin, ({ channel }) => {
        emitter.emit('join', toUserName(channel));
    });

    emitter.on('receive', (message) => {
        const handlers = events.get(
            (message.constructor as MessageConstructor).COMMAND
        );
        handlers?.forEach(handler => handler(message));
    });

    return { on, isOpened, sendPing };
};


let chatClient: ChatClient | undefined;

export const getChatClient = () => {
    if (!chatClient) {
        chatClient = createChatClient();
    }
    return chatClient;
};
