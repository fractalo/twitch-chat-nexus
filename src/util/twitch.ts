import Cookies from "js-cookie";

export const getSelfLoginName = () => Cookies.get('login');

export const getCurrnetChannelLoginName = () => {
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length >= 2) {
        if (pathSegments[1] === 'embed' || pathSegments[1] === 'popout') {
            return pathSegments.length >= 3 ? pathSegments[2] : '';
        } else {
            return pathSegments[1];
        }
    }
    return '';
};

export const isSelfViewerCardPage = () => {
    const selfLoginName = getSelfLoginName();
    if (!selfLoginName) return false;

    const currentPathSegments = window.location.pathname.split('/');
    
    return currentPathSegments.length >= 5 &&
        currentPathSegments[1] === 'popout' &&
        currentPathSegments[3] === 'viewercard' &&
        currentPathSegments[4] === selfLoginName;
};

export const setDaisyUiTheme = (element: HTMLElement) => {
    const callback = () => {
        if (document.documentElement.classList.contains('tw-root--theme-dark')) {
            element.setAttribute('data-theme', 'daisy-dark');
        } else if (document.documentElement.classList.contains('tw-root--theme-light')) {
            element.setAttribute('data-theme', 'daisy-light');
        }
    };
    new MutationObserver(callback).observe(document.documentElement, {attributes: true});
    callback();
};