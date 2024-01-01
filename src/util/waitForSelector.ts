import { waitForDOMReady } from "./waitForDOMReady";

export const waitForSelector = async(
    selector: string,
    root?: HTMLElement,
    signal?: AbortSignal
) => {
    await waitForDOMReady();

    const rootNode: Document | HTMLElement = root || document;

    return new Promise<HTMLElement>((resolve, reject) => {
        if (signal?.aborted) {
            reject(new Error('Aborted'));
            return;
        }

        let timeout: number;
        const findElement = () => {
            const element = rootNode.querySelector<HTMLElement>(selector);
            if (element) {
                mutationObserver.disconnect();
                clearTimeout(timeout);
                resolve(element);
            }
        };
        const mutationObserver = new MutationObserver(findElement);
        mutationObserver.observe(rootNode, { childList: true, subtree: true });
        timeout = window.setTimeout(() => {
            mutationObserver.disconnect();
            reject(new Error('Timeout'));
        }, 30_000);
        findElement();

        signal?.addEventListener('abort', () => {
            mutationObserver.disconnect();
            clearTimeout(timeout);
            reject(new Error('Aborted'));
        });
    });
};