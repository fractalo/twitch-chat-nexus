import ChatLogViewWindowOpenButton from "./ChatLogViewWindowOpenButton.svelte";
import liveChat from "src/injected/main/elements/LiveChat";
import { configStore } from "./stores";
import type { Unsubscribe } from "nanoevents";


class ChatLogViewWindowOpenButtonManager {
    private rootEl: HTMLElement;
    private button: ChatLogViewWindowOpenButton;
    private mutationObservers: MutationObserver[] = [];
    private unsubscribers: Unsubscribe[] = [];

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

    private destroyButton() {
        this.mutationObservers.forEach(observer => observer.disconnect());
        this.mutationObservers = [];
        this.unsubscribers.forEach(unbind => unbind());
        this.unsubscribers = [];
        this.rootEl.remove();
    }

    private updateButton(location: string) {
        this.destroyButton();

        switch (location) {
            case 'bottomOfChatWindow': {
                const insertButton = () => {
                    if (document.contains(this.rootEl)) return;
                    const chatSettingsButtonEl = document.querySelector('button[data-a-target="chat-settings"]');
                    const chatSettingsButtonWrapperEl = chatSettingsButtonEl?.parentElement?.parentElement?.parentElement;
                    chatSettingsButtonWrapperEl?.insertAdjacentElement('beforebegin', this.rootEl);
                };
                this.unsubscribers.push(
                    liveChat.on('update', insertButton)
                );
                liveChat.isEnabled && insertButton();
                break;
            }
            case 'chatSettingsMenu': {
                let chatSettingsBalloonEl: HTMLElement | null = null;
    
                const insertButton = () => {
                    if (document.contains(this.rootEl) || !chatSettingsBalloonEl) {
                        return;
                    }
                    const chatSettingsContentContainerEl = chatSettingsBalloonEl.querySelector('.chat-settings__content')?.firstElementChild;
                    if (
                        chatSettingsContentContainerEl && 
                        !chatSettingsBalloonEl.querySelector('.chat-settings__back-icon-container > button')
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
    
                const setChatSettingsMenuObserver = () => {
                    if (document.contains(chatSettingsBalloonEl)) return;

                    chatSettingsMenuObserver.disconnect();

                    chatSettingsBalloonEl = document.querySelector('.tw-dialog-layer div[data-a-target="chat-settings-balloon"]');

                    if (!chatSettingsBalloonEl) return;

                    chatSettingsMenuObserver.observe(chatSettingsBalloonEl, { childList: true, subtree: true });
                    insertButton();
                };

                const dialogObserver = new MutationObserver(setChatSettingsMenuObserver);

                let isObservingDialog = false;

                const observeDialog = () => {
                    if (!isObservingDialog) {
                        dialogObserver.observe(document.body, { childList: true });
                        setChatSettingsMenuObserver();
                        isObservingDialog = true;
                    }
                };

                this.unsubscribers.push(
                    liveChat.on('update', observeDialog),
                    liveChat.on('destroy', (isPermanent) => {
                        if (isPermanent) {
                            dialogObserver.disconnect();
                            isObservingDialog = false;
                        }
                    })
                );
                liveChat.isEnabled && observeDialog();

                this.mutationObservers.push(
                    chatSettingsMenuObserver, 
                    dialogObserver 
                );

                break;
            }
            default:
        }
    }
}

export default new ChatLogViewWindowOpenButtonManager();


