import { setDaisyUiTheme } from "src/util/twitch";
import { CURRENT_NOTICE_ID, getStoredViewedAppNoticeId, storeViewedAppNoticeId } from "./storage";
import AppNotice from "./AppNotice.svelte";

class AppNoticeManager {
    constructor() {
        if (window.location.hostname !== 'www.twitch.tv') return;
        if (getStoredViewedAppNoticeId() >= CURRENT_NOTICE_ID) return;

        this.init();
    }

    private init() {
        const rootEl = document.createElement('div');
        setDaisyUiTheme(rootEl);
        rootEl.classList.add('tcn-app-notice');

        const appNotice = new AppNotice({ target: rootEl });
        
        appNotice.$on('close', () => {
            storeViewedAppNoticeId(CURRENT_NOTICE_ID);
            appNotice.$destroy();
            rootEl.remove();
        });

        document.body.append(rootEl);
    }
}

export default new AppNoticeManager();