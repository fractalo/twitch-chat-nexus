import ChatLogView from "./ChatLogView.svelte";
import { getDrawerTabsEl, getModLogsEl } from "./viewerCard";
import { isSelfViewerCardPage, setDaisyUiTheme } from "src/util/twitch";
import StickyDateHeader from './StickyDateHeader.svelte';
import { getGqlClient } from "../../clients";
import messaging from "../../messaging";
import { SCRIPT_IDS } from "src/messaging";
import missingStyles from "./missingStyles.css?inline";
import { injectInlineStyle } from "src/util/injectors";
import { debugLog } from '../../../debug';

class ChatLogViewManager {
    constructor() {
        debugLog('ChatLogView/UI', 'Initializing manager');
        injectInlineStyle(missingStyles);
        this.initChatLogView();
        this.initStickyDateHeader();
    }

    private async initChatLogView() {
        debugLog('ChatLogView/UI', 'Waiting for drawer tabs');
        const modDrawerTabsEl = await getDrawerTabsEl();
        debugLog('ChatLogView/UI', 'Drawer tabs found', { count: modDrawerTabsEl.children.length });

        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);

        const modDrawerTabEls = [...modDrawerTabsEl.children] as HTMLElement[];
        const modDrawerTabBtnEls = modDrawerTabEls.map(el => el.querySelector<HTMLButtonElement | HTMLAnchorElement>('button,a'));
        let restoreContent = () => {};
        
        modDrawerTabBtnEls.forEach((el, i) => {
            el?.addEventListener('click', (event) => {
                if (!event.isTrusted) return;
                restoreContent();
                rootEl.style.display = (i === 0) ? 'block' : 'none';
            });
        });

        let isModerator: boolean = false;

        const nativeTabsInlineDisplayStyles = modDrawerTabEls.map(el => el.style.display);

        const updateLayout = () => {
            modDrawerTabEls.forEach((el, i) => el.style.display = nativeTabsInlineDisplayStyles[i]);
            rootEl.classList.remove(...rootEl.classList);

            if (isModerator) {
                rootEl.classList.add('w-full', 'py-2');
                modDrawerTabsEl.parentElement?.append(rootEl);
            } else {
                modDrawerTabEls.forEach((el, i) => {
                    if (i >= 1) {
                        el.style.display = 'none';
                    }
                });
                rootEl.classList.add('w-4/5');
                modDrawerTabsEl.append(rootEl);
            }
        };

        updateLayout();

        messaging.on('message', (message) => {
            if (message.from !== SCRIPT_IDS.INJECTED_INTERCEPTOR) return;
            
            if (
                message.type === 'IS_MODERATOR' && 
                message.content !== isModerator
            ) {
                isModerator = message.content;
                debugLog('ChatLogView/UI', 'Received changed permission state', { isModerator });
                updateLayout();
            }
        });

        messaging.waitForConnected(SCRIPT_IDS.INJECTED_INTERCEPTOR)
        .then(() => {
            messaging.postMessage({
                to: SCRIPT_IDS.INJECTED_INTERCEPTOR,
                type: 'IS_MODERATOR'
            });
        });
        
        const refreshMessagesTab = () => {
            debugLog('ChatLogView/UI', 'Refreshing messages tab', { messagesButtonFound: !!modDrawerTabBtnEls[0], alternateButtonFound: !!modDrawerTabBtnEls[1] });
            restoreContent();
            const modLogsEl = modDrawerTabsEl.closest('.viewer-card-mod-logs');
            modLogsEl?.classList.add('tcn-refreshing');
            let frame = 0;
            const showContent = () => {
                clearTimeout(timeout);
                cancelAnimationFrame(frame);
                modLogsEl?.classList.remove('tcn-refreshing');
            };
            const timeout = setTimeout(showContent, 1000);
            restoreContent = showContent;
            modDrawerTabBtnEls[1]?.click();
            setTimeout(() => {
                modDrawerTabBtnEls[0]?.click();
                frame = requestAnimationFrame(() => {
                    frame = requestAnimationFrame(showContent);
                });
            }, 10);
        };

        debugLog('ChatLogView/UI', 'Waiting for GQL client');
        const gqlClient = await getGqlClient();
        debugLog('ChatLogView/UI', 'GQL client acquired', { ready: gqlClient.isReady() });

        new ChatLogView({ target: rootEl, props: { refreshMessagesTab, gqlClient } });
        debugLog('ChatLogView/UI', 'ChatLogView component mounted');
    }

    private async initStickyDateHeader() { 
        debugLog('ChatLogView/UI', 'Waiting for mod logs element');
        const modLogsEl = await getModLogsEl();
        debugLog('ChatLogView/UI', 'Mod logs element found');

        let modLogsPageEl: HTMLElement | null = null;

        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);

        const stickyDateHeader = new StickyDateHeader({ target: rootEl });

        const updateModLogsPageEl = () => {
            if (document.contains(modLogsPageEl)) return;
            modLogsPageEl = document.querySelector('.viewer-card-mod-logs-page');

            if (!modLogsPageEl) return;

            modLogsPageEl.prepend(rootEl);

            stickyDateHeader.updateModLogsPageEl(modLogsPageEl);
        }

        new MutationObserver(updateModLogsPageEl).observe(modLogsEl, { childList: true });

        updateModLogsPageEl();
    }
}


debugLog('ChatLogView/UI', 'Page eligibility', { isSelfViewerCard: isSelfViewerCardPage() });
export default isSelfViewerCardPage() && new ChatLogViewManager();

