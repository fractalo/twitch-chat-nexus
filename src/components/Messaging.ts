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
}

export class Messaging {
    private id: string;
    private emitter: Emitter;
    private connections: Set<string>;
    private allowedIds: Set<string>;
    

    constructor(id: string, allowedIds: string[] = []) {
        this.id = id;
        this.emitter = createNanoEvents<Events>();
        this.connections = new Set();
        this.allowedIds = new Set(allowedIds);

        window.addEventListener('message', (event) => {
            const message = event.data as Message;
            if (
                event.source !== window || 
                !message.from || 
                message.from === this.id || 
                (this.allowedIds.size && !this.allowedIds.has(message.from)) ||
                (message.to && message.to !== this.id)
            ) {
                return;
            }
            
            if (message.type === 'READY') {
                if (this.connections.has(message.from)) return;
                
                this.postMessage('READY');
                this.connections.add(message.from);
                this.emitter.emit('connect', message.from);
                return;
            }

            this.emitter.emit('message', message);
        });
        this.postMessage('READY');
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    postMessage(type: string, content?: any, to?: string) {
        const message: Message = {
            type,
            content,
            from: this.id,
            to,
        };
        try {
            window.postMessage(message, '*');
        } catch (error) {
            console.error('postMessage error!', error);
        }
    }
}