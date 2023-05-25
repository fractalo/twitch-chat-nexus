import { createNanoEvents, type Emitter } from "nanoevents";


interface Events {
    connect: (id: string) => void;
    message: (message: Message) => void;
}

interface Message {
    type: string;
    content?: any;
    from: string;
    to?: string;
    contextId?: string;
}

interface PostMessageConfig {
    type: string;
    content?: any;
    to?: string;
    contextId?: string;
}

type ResponseCallback = (response: Message) => void;

export class Messaging {
    private id: string;
    private emitter: Emitter;
    private connections: Set<string>;
    private responseCallbacks: Map<string, ResponseCallback>;
    

    constructor(selfId: string) {
        this.id = selfId;
        this.emitter = createNanoEvents<Events>();
        this.connections = new Set();
        this.responseCallbacks = new Map();

        window.addEventListener('message', (event) => {
            const message = event.data as Message;
            if (
                event.source !== window || 
                !message.from || 
                message.from === this.id || 
                (message.to && message.to !== this.id)
            ) {
                return;
            }
            
            if (message.type === 'READY') {
                if (this.connections.has(message.from)) return;
                
                this.postMessage({type: "READY"});
                this.connections.add(message.from);
                this.emitter.emit('connect', message.from);
                return;
            }

            this.emitter.emit('message', message);

            if (message.contextId) {
                const callback = this.responseCallbacks.get(message.contextId);
                this.responseCallbacks.delete(message.contextId);
                callback && callback(message);
            }
        });
        this.postMessage({type: "READY"});
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    postMessage(config: PostMessageConfig, responseCallback?: ResponseCallback) {
        const contextId = config.contextId || crypto?.randomUUID();

        responseCallback && this.responseCallbacks.set(contextId, responseCallback);  

        const message: Message = {
            type: config.type,
            content: config.content,
            from: this.id,
            to: config.to,
            contextId
        };

        try {
            window.postMessage(message, '*');
        } catch (error) {
            console.error('postMessage error!', error);
            this.responseCallbacks.delete(contextId);
        }
    }

    isConnected(id: string) {
        return this.connections.has(id);
    }

    async waitForConnected(targetId: string) {
        if (this.isConnected(targetId)) {
            return;
        }

        return new Promise<void>((resolve) => {
            const unbind = this.on('connect', (id) => {
                if (id === targetId) {
                    unbind();
                    resolve();
                }
            });
        });
    }

    async waitForMessage<T>(from: string, type: string, timeout: number = 10_000) {
        return new Promise<T | null>((resolve) => {
            let timer: number| undefined;
            const removeListener = this.on('message', (message) => {
                if (
                    message.from === from &&
                    message.type === type
                ) {
                    clearTimeout(timer);
                    removeListener();
                    resolve(message.content);
                }
            });
            if (timeout > 0) {
                timer = window.setTimeout(() => {
                    removeListener();
                    resolve(null);
                }, timeout);
            }
        });
    }
}

