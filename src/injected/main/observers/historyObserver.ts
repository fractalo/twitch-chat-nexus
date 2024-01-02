import { createNanoEvents, type Emitter } from "nanoevents";

interface Events {
    pushState: () => void;
    replaceState: () => void;
    popState: () => void;
    locationChange: () => void;
}

class HistoryObserver {
    private emitter: Emitter<Events>;

    constructor() {
        this.emitter = createNanoEvents<Events>();

        const { history } = window;
        const { pushState, replaceState } = history;

        history.pushState = (...args) => {
            pushState.apply(history, args);
            this.emitter.emit('pushState');
            this.emitter.emit('locationChange');
        };

        history.replaceState = (...args) => {
            replaceState.apply(history, args);
            this.emitter.emit('replaceState');
            this.emitter.emit('locationChange');
        };

        window.addEventListener('popstate', () => {
            this.emitter.emit('popState');
            this.emitter.emit('locationChange');
        });
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

}


export default new HistoryObserver();