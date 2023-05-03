import ChatLogView from "./ChatLogView.svelte";
import { getDrawerTabsEl, getModLogsPageEl } from "./viewerCard";
import { forceModPermission } from "./forceModPermission";
import { isSelfViewerCardPage, setDaisyUiTheme } from "src/util/twitch";
import DateToolTip from './StickyDateHeader.svelte';
import { requestConfig } from './store';
import type { SortOrder } from "./types";

(async() => {
    if (!isSelfViewerCardPage()) {
        return;
    }

    const isModerator = forceModPermission();


    getDrawerTabsEl()
    .then((modDrawerTabsEl) => {
        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);

        const modDrawerTabEls = [...modDrawerTabsEl.children] as HTMLElement[];
        const modDrawerTabBtnEls = modDrawerTabEls.map(el => el.querySelector('a'));

        if (isModerator()) {
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
        
        const refreshMessagesTab = () => {
            modDrawerTabBtnEls[1]?.click();
            modDrawerTabBtnEls[0]?.click();
        };

        new ChatLogView({ target: rootEl, props: { refreshMessagesTab } });

    });

    getModLogsPageEl()
    .then((modLogsPageEl) => {
        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);

        modLogsPageEl.prepend(rootEl);

        new DateToolTip({ target: rootEl, props: { modLogsPageEl } });


        let sortOrder: SortOrder;
        requestConfig.subscribe(value => sortOrder = value.sortOrder);

        new MutationObserver(() => {
            const contentEl = modLogsPageEl.querySelector(".simplebar-scroll-content");
            if (contentEl && sortOrder === 'ASC') {
                const timer = setInterval(() => {
                    if (!contentEl.scrollTop) {
                        clearInterval(timer);
                        return;
                    }
                    contentEl.scrollTo(0, 0);
                }, 10);
                setTimeout(() => clearInterval(timer), 200);
            }
        }).observe(modLogsPageEl, { childList: true });
    });
    

})();




