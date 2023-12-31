export const isInIframe = (): boolean => {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}