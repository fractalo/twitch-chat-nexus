import { waitForDOMReady } from "./waitForDOMReady";

export const waitForSelector = async(selector: string) => {
    await waitForDOMReady();

    return new Promise<HTMLElement>((resolve) => {
        let timeout: number;
        const findElement = () => {
            const element = document.querySelector<HTMLElement>(selector);
            if (element) {
                documentObserver.disconnect();
                clearTimeout(timeout);
                resolve(element);
            }
        };
        const documentObserver = new MutationObserver(findElement);
        documentObserver.observe(document.body, { childList: true, subtree: true });
        timeout = window.setTimeout(() => documentObserver.disconnect(), 30_000);
        findElement();
    });
};