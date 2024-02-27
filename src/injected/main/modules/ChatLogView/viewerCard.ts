import domObserver from "../../observers/domObserver";


let modDrawerTabsElPromise: Promise<HTMLElement> | null = null;

export const getDrawerTabsEl = async() => {
    return modDrawerTabsElPromise ??= domObserver.waitForElement(
        '.viewer-card-mod-drawer-tabs', 
        el => el.childElementCount === 4
    );
};


let modLogsPageElPromise: Promise<HTMLElement> | null = null;

export const getModLogsPageEl = async() => {
    return modLogsPageElPromise ??= domObserver.waitForElement(
        '.viewer-card-mod-logs-page',
        (el) => Boolean(el.querySelector('.mod-logs-entry-list'))
    );
};

let modLogsElPromise: Promise<HTMLElement> | null = null;

export const getModLogsEl = async() => {
    return modLogsPageElPromise ??= domObserver.waitForElement(
        '.viewer-card-mod-logs',
        (el) => Boolean(el.querySelector('.mod-logs-entry-list'))
    );
};

