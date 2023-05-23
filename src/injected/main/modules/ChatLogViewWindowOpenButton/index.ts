import ChatLogViewWindowOpenButton from "./ChatLogViewWindowOpenButton.svelte";
import liveChat from "src/injected/main/elements/LiveChat";
import { configStore } from "./stores";


class ChatLogViewWindowOpenButtonManager {
    private rootEl: HTMLElement;
    private button: ChatLogViewWindowOpenButton;
    private mutationObservers: MutationObserver[] = [];
    private removeLiveChatListener: ReturnType<typeof liveChat.on> | null = null;

    constructor() {
        this.rootEl = document.createElement('div');
        this.button = new ChatLogViewWindowOpenButton({ target: this.rootEl });

        let prevLocation = '';
        
        configStore.subscribe(config => {
            if (!config) return;

            if (config.location !== prevLocation) {
                prevLocation = config.location;
                this.updateButton(config.location);
            }
        });
    }

    private updateButton(location: string) {
        this.mutationObservers.forEach(observer => observer.disconnect());
        this.removeLiveChatListener?.();
        this.rootEl.remove();

        switch (location) {
            case 'bottomOfChatWindow': {
                const insertButton = () => {
                    if (document.contains(this.rootEl)) return;
                    const chatSettingsButtonEl = document.querySelector('button[data-a-target="chat-settings"]');
                    const chatSettingsButtonWrapperEl = chatSettingsButtonEl?.parentElement?.parentElement?.parentElement?.parentElement;
                    chatSettingsButtonWrapperEl?.parentElement?.insertBefore(this.rootEl, chatSettingsButtonWrapperEl);
                };
                this.removeLiveChatListener = liveChat.on('update', insertButton);
                liveChat.isEnabled && insertButton();
                break;
            }
            case 'chatSettingsMenu': {
                let chatSettingsButtonWrapperEl: HTMLElement | null = null;
    
                const insertButton = () => {
                    if (document.contains(this.rootEl) || !chatSettingsButtonWrapperEl) {
                        return;
                    }
                    const chatSettingsContentContainerEl = chatSettingsButtonWrapperEl.querySelector('.chat-settings__content')?.firstElementChild;
                    if (
                        chatSettingsContentContainerEl && 
                        !chatSettingsButtonWrapperEl.querySelector('.chat-settings__back-icon-container > button')
                    ) {
                        if (
                            chatSettingsContentContainerEl.getAttribute('data-a-target') === 'chat-settings-mod-view' &&
                            chatSettingsContentContainerEl.firstElementChild
                        ) {
                            chatSettingsContentContainerEl.firstElementChild.append(this.rootEl);
                        } else {
                            chatSettingsContentContainerEl.append(this.rootEl);
                        }
                    }
                };
    
                const chatSettingsMenuObserver = new MutationObserver(insertButton);
                this.mutationObservers = [chatSettingsMenuObserver];
    
                const setChatSettingsMenuObserver = () => {
                    if (document.contains(chatSettingsButtonWrapperEl)) return;
    
                    chatSettingsMenuObserver.disconnect();
    
                    const chatSettingsButtonEl = document.querySelector('button[data-a-target="chat-settings"]');
                    chatSettingsButtonWrapperEl = chatSettingsButtonEl?.parentElement?.parentElement?.parentElement || null;
    
                    if (chatSettingsButtonWrapperEl) {
                        chatSettingsMenuObserver.observe(chatSettingsButtonWrapperEl, { childList: true, subtree: true });
                        insertButton();
                    }
                };
                this.removeLiveChatListener = liveChat.on('update', setChatSettingsMenuObserver);
                liveChat.isEnabled && setChatSettingsMenuObserver();
                break;
            }
            default:
        }
    }
}

export default new ChatLogViewWindowOpenButtonManager();


