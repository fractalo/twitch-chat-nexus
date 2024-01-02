import { createNanoEvents, type Emitter } from "nanoevents";
import { waitForDOMReady } from "src/util/waitForDOMReady";
import throttle from 'lodash/throttle';

interface Events {
    'update': () => void;
}

class DOMObserver {
    private emitter: Emitter<Events>;
    private observer: MutationObserver;

    constructor() {
        this.emitter = createNanoEvents<Events>();

        this.observer = new MutationObserver(throttle(() => this.emitter.emit('update'), 100));
    }

    private async observe() {
        await waitForDOMReady();
        if (!this.hasListeners()) return;
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    private disconnect() {
        this.observer.disconnect();
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        const unbind = this.emitter.on(event, callback);
        this.observe();
        return () => {
            unbind();
            !this.hasListeners() && this.disconnect();
        };
    }

    async waitForElement(selectors: string, criteria?: (el: HTMLElement) => boolean) {
        return new Promise<HTMLElement>((resolve) => {
            let timeout: number;
            const findElement = () => {
                const element = document.querySelector<HTMLElement>(selectors);
                if (element && (!criteria || criteria(element))) {
                    removeListener();
                    clearTimeout(timeout);
                    resolve(element);
                }
            };
            const removeListener = this.on('update', findElement);
            timeout = window.setTimeout(() => removeListener(), 60_000);
            findElement();
        });
    }

    private hasListeners() {
        return Object.values(this.emitter.events).some(event => event?.length);
    }

}


export default new DOMObserver();