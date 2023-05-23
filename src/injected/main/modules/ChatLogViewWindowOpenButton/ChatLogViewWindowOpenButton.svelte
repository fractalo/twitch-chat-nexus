<script lang="ts">
    import { getCurrnetChannelLoginName, getSelfLoginName } from "src/util/twitch";
    import ChatInputButton from "./buttons/ChatInputButton.svelte";
    import ChatSettingsMenuButton from "./buttons/ChatSettingsMenuButton.svelte";
    import { isWindowAvailable } from "src/util/isWindowAvailable";
    import { configStore } from "./stores";
    import type { ComponentType } from "svelte";

    interface ChatLogViewWindow {
        handle: Window | null;
        type: string;
    }

    let chatLogViewWindow: ChatLogViewWindow | null = null;

    const POPUP_WIDTH = 410;
    const POPUP_HEIGHT = 580;

    const createWindowDimensionSize = (dimension: number, scaleFactor: number, minSize: number) => {
        const size = Math.round(dimension * scaleFactor);
        return size >= minSize ? size : minSize;
    };

    const handleButtonClick = () => {
        if (!$configStore) return;

        const selfLoginName = getSelfLoginName();
        const channelLoginName = getCurrnetChannelLoginName();
        if (!selfLoginName || !channelLoginName) return;
        
        const chatLogViewUrl = `https://www.twitch.tv/popout/${channelLoginName}/viewercard/${selfLoginName}`;

        if (
            !$configStore.alwaysNewWindow && 
            chatLogViewWindow?.handle && 
            isWindowAvailable(chatLogViewWindow.handle) &&
            chatLogViewWindow.type === $configStore.windowType
        ) {
            chatLogViewWindow.handle.location.href = chatLogViewUrl;
            chatLogViewWindow.handle.focus();
        } else {
            switch ($configStore.windowType) {
                case 'popup': {
                    const width = createWindowDimensionSize(POPUP_WIDTH, $configStore.popupSize, 100);
                    const height = createWindowDimensionSize(POPUP_HEIGHT, $configStore.popupSize, 100);
                    chatLogViewWindow = {
                        handle: window.open(chatLogViewUrl, '_blank', `popup, width=${width}, height=${height}, top=50`),
                        type: $configStore.windowType
                    }
                    break;
                }
                case 'tab': {
                    chatLogViewWindow = {
                        handle: window.open(chatLogViewUrl, '_blank'),
                        type: $configStore.windowType
                    }
                    break;
                }
                default:
            }
        }
    };

    const buttonComponents: Record<string, ComponentType> = {
        bottomOfChatWindow: ChatInputButton,
        chatSettingsMenu: ChatSettingsMenuButton
    };

</script>

{#if $configStore}
    <svelte:component this={buttonComponents[$configStore.location]} {handleButtonClick} />
{/if}
