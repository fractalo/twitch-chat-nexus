import { getChatClient } from '../../clients/ChatClient';
import ChatIndicator from "./ChatIndicator.svelte";
import type { Message } from 'ircv3/lib';
import type { Ping, PrivMsg } from './types';
import { insertRootEl } from './insertRootEl';
import { waitForDOMReady } from 'src/util/waitForDOMReady';

(async() => {
    const chatClient = getChatClient();

    await waitForDOMReady();

    const rootEl = document.createElement('div');
    const chatIndicator = new ChatIndicator({ target: rootEl });

    insertRootEl(rootEl);

    let latestPrivMsg: PrivMsg | null = null;
    let latestPing: Ping | null = null;

    const getClientNonce = (message: Message) => message.tags.get('client-nonce');

    
    chatClient.on('send', (message) => {
        switch (message.command) {
            case 'PRIVMSG': {
                const nonce = getClientNonce(message);
                if (nonce) {
                    chatIndicator.setState('waiting');
                    latestPrivMsg = { nonce, sentAt: Date.now() };
                } else {
                    chatIndicator.setState('idle'); 
                }
                break;
            }
            case 'PING': {
                const uuid = message._parsedParams?.text?.value;
                latestPing = {
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
            case 'USERSTATE': {
                const nonce = getClientNonce(message);
                if (nonce && latestPrivMsg?.nonce === nonce) {
                    chatIndicator.setState('success'); 
                    chatIndicator.updateResponseTime(Date.now() - latestPrivMsg.sentAt, 0.25);
                    latestPrivMsg = null;
                }
                break;
            }
            case 'JOIN': {
                chatIndicator.setState('idle');
                break;
            }
            case 'PONG': {
                const uuid = message._parsedParams?.text?.value;
                if (typeof uuid === 'string' && latestPing?.uuid === uuid) {
                    chatIndicator.updateResponseTime(Date.now() - latestPing.sentAt + 100, 0.15);
                    latestPing = null;
                }
                break;
            }
            default:
        }
    });


    chatClient.on('create', () => {
        chatIndicator.resetResponseTime();
    });

    chatClient.on('ping', () => {
        latestPing = { uuid: '', sentAt: Date.now() };
    });

    if (chatClient.isOpened()) {
        chatClient.sendPing(true);
    } else {
        chatClient.on('open', () => {
            setTimeout(() => chatClient.sendPing(true), 5000);
        });
    }


})();

