import ChatIndicator from "./ChatIndicator.svelte";
import liveChat from "../../elements/LiveChat";
import type { Message } from "node_modules/ircv3/lib";
import type { Ping, PrivMsg } from "./types";
import { getChatClient, getGqlClient } from "../../clients";
import { isRecord } from "src/util/typePredicates";

class ChatIndicatorManager {
    private rootEl: HTMLElement;
    private indicator: ChatIndicator;

    private latestPrivMsg: PrivMsg | null = null;
    private latestPing: Ping | null = null;

    constructor() {
        this.rootEl = document.createElement('div');
        this.indicator = new ChatIndicator({ target: this.rootEl });

        this.keepRootInserted();
        this.setupChatClientListeners();
        this.setupGqlClientListeners();
    }

    private keepRootInserted() {
        const insertRoot = () => {
            if (document.contains(this.rootEl)) return;
            const chatInputEl = document.querySelector('.chat-input__textarea');
            chatInputEl && chatInputEl.prepend(this.rootEl);
        };
        liveChat.on('update', insertRoot);
        liveChat.isEnabled && insertRoot();
    }

    private getClientNonce(message: Message) {
        return message.tags.get('client-nonce');
    } 

    private waitForMessage(nonce: string) {
        if (this.latestPrivMsg?.nonce === nonce) return;
        this.indicator.setState('waiting');
        this.latestPrivMsg = { nonce, sentAt: Date.now() };
    }

    private async setupGqlClientListeners() {
        const gqlClient = await getGqlClient();
        gqlClient.setRequestHook('sendChatMessage', (request) => {
            const input = request.variables?.input;
            if (isRecord(input) && typeof input.nonce === 'string' && input.nonce) {
                this.waitForMessage(input.nonce);
            }
            return { type: 'request', request };
        });
    }

    private async setupChatClientListeners() {
        const chatClient = await getChatClient();

        chatClient.on('send', (message) => {
            switch (message.command) {
                case 'PRIVMSG': {
                    const nonce = this.getClientNonce(message);
                    if (nonce) {
                        this.waitForMessage(nonce);
                    } else {
                        this.indicator.setState('idle'); 
                    }
                    break;
                }
                case 'PING': {
                    const uuid = message._parsedParams?.text?.value;
                    this.latestPing = {
                        uuid: typeof uuid === 'string' ? uuid : '',
                        sentAt: Date.now()
                    };
                break;
                }
                default:
            }
        });

        chatClient.on('receive', (message) => {
            switch (message.command) {
                case 'PRIVMSG':
                case 'USERSTATE': {
                    if (!this.latestPrivMsg) return;
                    const nonce = this.getClientNonce(message);
                    if (nonce && this.latestPrivMsg.nonce === nonce) {
                        this.indicator.setState('success'); 
                        this.indicator.updateResponseTime(Date.now() - this.latestPrivMsg.sentAt, 0.25);
                        this.latestPrivMsg = null;
                    }
                    break;
                }
                case 'JOIN': {
                    this.indicator.setState('idle');
                    break;
                }
                case 'PONG': {
                    const uuid = message._parsedParams?.text?.value;
                    if (typeof uuid === 'string' && this.latestPing?.uuid === uuid) {
                        this.indicator.updateResponseTime(Date.now() - this.latestPing.sentAt + 100, 0.15);
                        this.latestPing = null;
                    }
                    break;
                }
                default:
            }
        });


        chatClient.on('create', () => {
            this.indicator.resetResponseTime();
        });

        chatClient.on('ping', () => {
            this.latestPing = { uuid: '', sentAt: Date.now() };
        });
    }
}

export default new ChatIndicatorManager();
