import historyObserver from '../observers/historyObserver';
import routeMatchers from './routeMatchers';
import { type Emitter, createNanoEvents } from "nanoevents";


interface Events {
    change: (routeName: string) => void;
}

class Routes {
    private emitter: Emitter<Events>;
    private routeName: string;

    constructor() {
        this.emitter = createNanoEvents<Events>();
        this.routeName = this.getCurrentRouteName();

        historyObserver.on('locationChange', () => {
            this.routeName = this.getCurrentRouteName(); 
            this.emitter.emit('change', this.routeName);
        });
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    private getCurrentRouteName() {
        const path = location.pathname;
        const state = history.state;

        const route = routeMatchers.find((matcher) => {
            const match = matcher.regex.exec(path);
            return match && (!matcher.matchState || matcher.matchState(state));
        });

        return route?.name || '';
    }

    get name() {
        return this.routeName;
    }
}


export default new Routes();