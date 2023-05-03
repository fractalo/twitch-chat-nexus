let domReadyPromise: Promise<void> | null = null;

export const waitForDOMReady = async() => {
    if (document.readyState !== 'loading') {
        return;
    }

    if (!domReadyPromise) { 
        domReadyPromise = new Promise<void>((resolve) => {
            const listener = () => {
                window.removeEventListener('DOMContentLoaded', listener);
                resolve();
            }
            window.addEventListener('DOMContentLoaded', listener);
        });
    }
    return domReadyPromise;
};