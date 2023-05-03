import liveChat from '../../elements/LiveChat';

export const insertRootEl = async(rootEl: HTMLElement) => {

    liveChat.on('update', () => {
        if (document.contains(rootEl)) return;
        const chatInputEl = document.querySelector('.chat-input__textarea');
        chatInputEl && chatInputEl.prepend(rootEl);
    });

};