import { findReactChildFibers, findReactInstance } from "src/util/twitch";
import liveChat from "../../elements/LiveChat";


let viewerCardOpener: (() => void) | null = null;

const updateViewerCardOpener = (el: HTMLElement | null) => {
    if (!el) return;
    
    const fibers = findReactChildFibers(
        findReactInstance(el),
        fiber => {
            return fiber.pendingProps?.onShowViewerCard || fiber.stateNode?.openUserCard;
        },
        200,
        10
    );

    for (const fiber of fibers) {
        if (typeof fiber.pendingProps?.onShowViewerCard === 'function') {
            viewerCardOpener = fiber.pendingProps.onShowViewerCard;
            return;
        }

        if (typeof fiber.stateNode?.openUserCard === 'function') {
            viewerCardOpener = fiber.stateNode.openUserCard;
        }
    }
};

liveChat.on('update:rootEl', rootEl => updateViewerCardOpener(rootEl));

updateViewerCardOpener(liveChat.rootEl);


export const openViewerCard = (event: Event, userLogin?: string, messageId?: string, opener?: unknown) => {
    if (typeof opener !== 'function') {
        opener = viewerCardOpener;
    }

    if (
        typeof opener !== 'function' || 
        !event.currentTarget || 
        !userLogin
    ) {
        return;
    }

    let rect: DOMRect | undefined;

    if (event.currentTarget instanceof Element) {
        rect = event.currentTarget.getBoundingClientRect();
    }

    opener(userLogin, 0, messageId, rect?.bottom);
};