import Cookies from "js-cookie";
import type { Fiber } from "react-reconciler";

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


export const findReactInstance = (element: Element): Fiber | undefined => {
    const fiberEntry = Object.entries(element).find(([key, value]) => {
        return key.startsWith('__reactInternalInstance$') && value && typeof value === 'object';
    });

    if (!fiberEntry) return;

    const [, fiber] = fiberEntry;
    return fiber as Fiber;
};

export const isOriginalElement = (element: HTMLElement) => {
    return findReactInstance(element)?.stateNode === element;
};

export const findOriginalElement = (elements: NodeListOf<HTMLElement> | undefined): HTMLElement | undefined => {
    if (!elements) return;
    
    for (const element of elements) {
        if (isOriginalElement(element)) {
            return element;
        }
    }
};

export const findReactParentInstance = (fiber: Fiber | null | undefined, predicate: (fiber: Fiber) => boolean, maxDepth = 15, depth = 0): Fiber | null => {
    if (!fiber || depth > maxDepth) {
        return null;
    }

    try {
        if (predicate(fiber)) {
            return fiber;
        }
    } catch {}
  
    return findReactParentInstance(fiber.return, predicate, maxDepth, depth + 1);
};

export const findReactSiblingInstance = (fiber: Fiber | null | undefined, predicate: (fiber: Fiber) => boolean, maxDepth = 15, depth = 0): Fiber | null => {
    if (!fiber || depth > maxDepth) {
        return null;
    }

    try {
        if (predicate(fiber)) {
            return fiber;
        }
    } catch {}
  
    return findReactSiblingInstance(fiber.sibling, predicate, maxDepth, depth + 1);
};