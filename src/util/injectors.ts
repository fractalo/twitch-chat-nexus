export function injectScript(path: string) {
    const scriptEl = document.createElement('script');
    scriptEl.src = chrome.runtime.getURL(path);
    scriptEl.type = 'module';
    scriptEl.addEventListener('load', () => scriptEl.remove());
    (document.head || document.documentElement).prepend(scriptEl);
}

export function injectStyle(path: string) {
    const _injectStyle = () => {
        const styleEl = document.createElement('link');
        styleEl.rel = 'stylesheet';
        styleEl.href = path;
        (document.head || document.documentElement).append(styleEl);
    }
    // wait for document.head exists
    if (document.readyState !== 'loading') {
        _injectStyle();
    } else {
        window.addEventListener('DOMContentLoaded', () => _injectStyle());
    }
}

export function injectInlineStyle(css: string) {
    const _injectStyle = () => {
        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        (document.head || document.documentElement).append(styleEl);
    }
    // wait for document.head exists
    if (document.readyState !== 'loading') {
        _injectStyle();
    } else {
        window.addEventListener('DOMContentLoaded', () => _injectStyle());
    }
}