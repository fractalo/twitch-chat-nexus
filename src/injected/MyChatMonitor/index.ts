import { chatClient } from './ChatClient';
import ChatIndicator from "./ChatIndicator.svelte";
import type { Message } from 'ircv3/lib';
import type { Ping, PrivMsg } from './types';


const rootEl = document.createElement('div');
const chatIndicator = new ChatIndicator({ target: rootEl });

new MutationObserver(() => {
    if (document.contains(rootEl)) return;
    const chatInputEl = document.querySelector('div[data-a-target="chat-input"]');
    const chatInputWrapperEl = chatInputEl?.parentElement?.parentElement?.parentElement;
    chatInputWrapperEl && chatInputWrapperEl.prepend(rootEl);
}).observe(document.body || document.documentElement, { childList: true, subtree: true });


let latestPrivMsg: PrivMsg | null = null;
let latestPing: Ping | null = null;

const getClientNonce = (message: Message) => message.tags.get('client-nonce');

chatClient.on('send', (message) => {
    const command = message.command;

    if (command === 'PRIVMSG') {
        const nonce = getClientNonce(message);
        if (nonce) {
            chatIndicator.setState('waiting');
            latestPrivMsg = { nonce, sentAt: Date.now() };
        } else {
            chatIndicator.setState('idle'); 
        }
    } else if (command === 'PING') {
        const uuid = message.params?.message;
        latestPing = {
            uuid: typeof uuid === 'string' ? uuid : '',
            sentAt: Date.now()
        };
    }
});

chatClient.on('receive', (message) => {
    const command = message.command;

    if (command === 'USERSTATE') {
        const nonce = getClientNonce(message);
        if (nonce && latestPrivMsg?.nonce === nonce) {
            chatIndicator.setState('success'); 
            chatIndicator.updateResponseTime(Date.now() - latestPrivMsg.sentAt, 0.3);
            latestPrivMsg = null;
        }
    } else if (command === 'JOIN') {
        chatIndicator.setState('idle');
    } else if (command === 'PONG') {
        const uuid = message.params?.message;
        if (typeof uuid === 'string' && latestPing?.uuid === uuid) {
            chatIndicator.updateResponseTime(Date.now() - latestPing.sentAt + 100, 0.2);
            latestPing = null;
        }
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
