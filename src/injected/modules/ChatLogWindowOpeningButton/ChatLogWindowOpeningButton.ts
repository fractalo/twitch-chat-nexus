import type { MainCategorySettingValues } from "src/components/settings";
import { isWindowAvailable } from "src/util/isWindowAvailable";
import { getCurrnetChannelLoginName, getSelfLoginName } from "src/util/twitch";
import type { OpeningButtonConfig } from "./types";
import ChatLogWindowOpeningButton from "./ChatLogWindowOpeningButton.svelte";
import { waitForDOMReady } from "src/util/waitForDOMReady";
import liveChat from "src/injected/elements/LiveChat";


let config: OpeningButtonConfig | null = null;

let chatLogWindow: Window | null = null;

let mutationObservers: MutationObserver[] = [];

let removeLiveChatListener: ReturnType<typeof liveChat.on> | null = null;

const handleButtonClick = () => {
    if (!config) return;

    const selfLoginName = getSelfLoginName();
    const channelLoginName = getCurrnetChannelLoginName();
    if (!selfLoginName || !channelLoginName) return;
    
    const chatLogViewUrl = `https://www.twitch.tv/popout/${channelLoginName}/viewercard/${selfLoginName}`;

    if (!config.alwaysNewWindow && chatLogWindow && isWindowAvailable(chatLogWindow)) {
        chatLogWindow.location.href = chatLogViewUrl;
        chatLogWindow.focus();
    } else {
        switch (config.windowType) {
            case 'popup': {
                chatLogWindow = window.open(chatLogViewUrl, '_blank', 'popup, width=510, height=720, top=50');
                break;
            }
            case 'tab': {
                chatLogWindow = window.open(chatLogViewUrl, '_blank');
                break;
            }
            default:
        }
    }
};

const rootEl = document.createElement('div');
const openingButton = new ChatLogWindowOpeningButton({target: rootEl, props: { handleButtonClick }})

const updateButton = async(config: OpeningButtonConfig) => {
    await waitForDOMReady();

    mutationObservers.forEach(observer => observer.disconnect());
    removeLiveChatListener && removeLiveChatListener();
    rootEl.remove();
    openingButton.updateLocation(config.location);

    switch (config.location) {
        case 'bottomOfChatWindow': {
            const insertButton = () => {
                if (document.contains(rootEl)) return;
                const chatSettingsButtonEl = document.querySelector('button[data-a-target="chat-settings"]');
                const chatSettingsButtonWrapperEl = chatSettingsButtonEl?.parentElement?.parentElement?.parentElement?.parentElement;
                chatSettingsButtonWrapperEl?.parentElement?.insertBefore(rootEl, chatSettingsButtonWrapperEl);
            };
            removeLiveChatListener = liveChat.on('update', insertButton);
            insertButton();
            break;
        }
        case 'chatSettingsMenu': {
            let chatSettingsButtonWrapperEl: HTMLElement | null = null;

            const insertButton = () => {
                if (document.contains(rootEl) || !chatSettingsButtonWrapperEl) {
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
                        chatSettingsContentContainerEl.firstElementChild.append(rootEl);
                    } else {
                        chatSettingsContentContainerEl.append(rootEl);
                    }
                }
            };

            const chatSettingsMenuObserver = new MutationObserver(insertButton);
            mutationObservers = [chatSettingsMenuObserver];

            const setChatSettingsMenuObserver = () => {
                if (document.contains(chatSettingsButtonWrapperEl)) return;

                if (chatSettingsMenuObserver) {
                    chatSettingsMenuObserver.disconnect();
                }

                const chatSettingsButtonEl = document.querySelector('button[data-a-target="chat-settings"]');
                chatSettingsButtonWrapperEl = chatSettingsButtonEl?.parentElement?.parentElement?.parentElement || null;

                if (chatSettingsButtonWrapperEl) {
                    chatSettingsMenuObserver.observe(chatSettingsButtonWrapperEl, { childList: true, subtree: true });
                    insertButton();
                }
            };
            removeLiveChatListener = liveChat.on('update', setChatSettingsMenuObserver);
            setChatSettingsMenuObserver();
            break;
        }
        default:
    }
};

export const updateConfig = (settings: MainCategorySettingValues) => {
    const prevConfig = config;

    config = {
        location: settings.chatLogView.openingButton.location as string,
        windowType: settings.chatLogView.openingButton.windowType as string,
        alwaysNewWindow: settings.chatLogView.openingButton.alwaysNewWindow as boolean,
    };

    if (config.windowType !== prevConfig?.windowType) {
        chatLogWindow = null;
    }

    if (config.location !== prevConfig?.location) {
        updateButton(config);
    }
};