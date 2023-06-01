import ChatLogView from "./ChatLogView.svelte";
import { getDrawerTabsEl, getModLogsPageEl } from "./viewerCard";
import { isSelfViewerCardPage, setDaisyUiTheme } from "src/util/twitch";
import StickyDateHeader from './StickyDateHeader.svelte';
import { requestConfig } from './stores';
import type { PaginationDirection, SortOrder } from "./types";
import { getGqlClient } from "../../clients";
import messaging from "../../messaging";
import { ScriptIds } from "src/constants/scripts";

class ChatLogViewManager {
    private removeMessageListener: ReturnType<typeof messaging.on>;
    private isModerator: boolean;

    constructor() {
        this.isModerator = false;

        this.removeMessageListener = messaging.on('message', (message) => {
            if (message.from !== ScriptIds.INJECTED_INTERCEPTOR) return;
            
            if (message.type === 'IS_MODERATOR') {
                this.isModerator = message.content;
            }
        });

        messaging.postMessage({
            to: ScriptIds.INJECTED_INTERCEPTOR,
            type: 'IS_MODERATOR'
        });

        this.initChatLogView();
        this.initStickyDateHeader();
    }

    private async initChatLogView() {
        const modDrawerTabsEl = await getDrawerTabsEl();

        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);

        const modDrawerTabEls = [...modDrawerTabsEl.children] as HTMLElement[];
        const modDrawerTabBtnEls = modDrawerTabEls.map(el => el.querySelector<HTMLButtonElement | HTMLAnchorElement>('button,a'));

        if (this.isModerator) {
            modDrawerTabBtnEls.forEach((el, i) => {
                el?.addEventListener('click', (event) => {
                    if (!event.isTrusted) return;
                    rootEl.style.display = (i === 0) ? 'block' : 'none';
                });
            });
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
        this.removeMessageListener();
        
        const refreshMessagesTab = () => {
            modDrawerTabBtnEls[1]?.click();
            modDrawerTabBtnEls[0]?.click();
        };

        const gqlClient = await getGqlClient();

        new ChatLogView({ target: rootEl, props: { refreshMessagesTab, gqlClient } });
    }

    private async initStickyDateHeader() { 
        const modLogsPageEl = await getModLogsPageEl();

        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);

        modLogsPageEl.prepend(rootEl);

        new StickyDateHeader({ target: rootEl, props: { modLogsPageEl } });

        let paginationDirection: PaginationDirection;
        requestConfig.subscribe(value => paginationDirection = value.direction);

        new MutationObserver(() => {
            const contentEl = modLogsPageEl.querySelector(".simplebar-scroll-content");
            
            if (contentEl && paginationDirection === 'previous') {
                const timer = setInterval(() => {
                    if (!contentEl.scrollTop) {
                        const scrollToTop = () => {
                            contentEl.scrollTo(0, 0);
                            contentEl.removeEventListener('scroll', scrollToTop);
                            contentEl.removeEventListener('click', scrollToTop);
                        };
                        contentEl.addEventListener('scroll', scrollToTop);
                        contentEl.addEventListener('click', scrollToTop);
                        clearInterval(timer);
                        return;
                    }
                    contentEl.scrollTo(0, 0);
                }, 10);
                setTimeout(() => clearInterval(timer), 200);
            }
        }).observe(modLogsPageEl, { childList: true });
    }
}


export default isSelfViewerCardPage() && new ChatLogViewManager();

