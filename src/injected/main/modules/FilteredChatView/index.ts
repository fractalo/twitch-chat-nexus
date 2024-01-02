import liveChat from "../../elements/LiveChat";
import FilteredChatListRoot from './FilteredChatListRoot.svelte';
import Split from 'split.js';
import ChatListGutter from "./ChatListGutter.svelte";
import { configStore, initialRootSizeRatio, isGutterDraggedStore, rootSizeRatioStore } from "./stores";
import type { Config, SplitSizeRatio } from "./types";
import { createNanoEvents, type Emitter, type Unsubscribe } from "nanoevents";
import ChatList from "../../elements/LiveChat/ChatList";
import { getStoredRootSizeRatio, storeRootSizeRatio } from "./rootSizeRatio";
import { throttle } from "lodash";


const SPLIT_OPTIONS = {
    snapOffset: 35,
    gutterSize: 10,
} as const satisfies Split.Options;


const SPLIT_ANIMATION_DURATIONS = {
    normal: 300,
    slow: 600,
} as const; [
    'normal',
    'slow'
] as const;

type SplitAnimateType = keyof typeof SPLIT_ANIMATION_DURATIONS;

const SPLIT_ANIMATE_CLASSNAME_PREFIX = 'tcn-chat-split-animate';

const createSplitAnimateClassname = (type: SplitAnimateType) => {
    return `${SPLIT_ANIMATE_CLASSNAME_PREFIX}-${type}` as const;
};

const SPLIT_ANIMATE_CLASSNAMES = Object.keys(SPLIT_ANIMATION_DURATIONS).map(type => {
    return createSplitAnimateClassname(type as SplitAnimateType);
});


interface Events {
    'click:share': () => void;
    'expand': () => void;
}

class FilteredChatView {
    private isInitialized: boolean = false;
    private config: Config;
    private readonly emitter: Emitter<Events>;

    private rootEl: HTMLElement;
    private filteredChatListRoot: FilteredChatListRoot | null = null;
    private splitter: Split.Instance | null = null;
    private splitEls: HTMLElement[] | null = null;
    private gutters: ChatListGutter[] = [];
    private gutterUnsubscribers: (() => void)[] = [];
    private rootSizeRatio: SplitSizeRatio = initialRootSizeRatio;
    private isGutterDragged: boolean = false;

    private readonly chatList = ChatList.getInstance();

    private chatSplitAnimateTimeout: number | undefined;
    private rootCollapseTimeout: number | undefined;
    private isIdle: boolean = true;
    private hasFilteredChat: boolean = false;

    private unsubscribers: Unsubscribe[] = [];

    constructor(config: Config) {
        this.emitter = createNanoEvents();

        this.rootEl = document.createElement('div');
        this.rootEl.classList.add('tcn-filtered-chat');
        this.rootEl.classList.add('relative', 'overflow-hidden');

        isGutterDraggedStore.subscribe(value => this.isGutterDragged = value);
        rootSizeRatioStore.subscribe(value => this.rootSizeRatio = value);

        this.setConfig(this.config = config);
    }

    public setConfig(config: Config) {
        const prevConfig = this.config;
        this.config = config;

        if (!config.isEnabled) {
            return this.destroy();
        }
        this.init();

        if (prevConfig.isLocationReversed !== config.isLocationReversed) {
            this.destroySplitter();
            this.setupChatLayout();
        }

        if (prevConfig.useAutoResize !== config.useAutoResize) {
            if (!config.useAutoResize) {
                this.expandFilteredChatList();
            } else if (!this.hasFilteredChat || this.isIdle) {
                this.collapseFilteredChatList();
            }
        }

        if (prevConfig.collapseAfter !== config.collapseAfter && !this.isIdle) {
            this.resetRootCollapseTimeout();
        }
    }  

    public on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    private init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.chatList.use();
 
        this.filteredChatListRoot = new FilteredChatListRoot({ target: this.rootEl });
        
        this.unsubscribers.push(
            liveChat.on('update', () => this.setupChatLayout()),
            liveChat.on('destroy', (isPermanent) => {
                if (isPermanent) {
                    this.destroySplitter();
                }
            }),
            this.chatList.on('resize', () => this.handleChatListResize()),
            this.filteredChatListRoot.$on('update', () => {
                this.handleFilteredChatListUpdate();
            }),
            this.filteredChatListRoot.$on('scroll', 
                throttle(() => this.resetRootCollapseTimeout(), 100)
            ),
        );
        
        liveChat.isEnabled && this.setupChatLayout();
    }

    private resetRootCollapseTimeout() {
        window.clearTimeout(this.rootCollapseTimeout);
        this.rootCollapseTimeout = window.setTimeout(() => {
            this.config.useAutoResize && this.collapseFilteredChatList('slow');
            this.isIdle = true;
        }, this.config.collapseAfter * 1000);
        this.isIdle = false;
    }

    /**
     * fix rootSizeRatio to snapOffset or (100 - snapOffset) if any split Size is larger than 0 and smaller than snapOffset.
     * @param rootSizeRatio rootEl height
     * @returns fixed rootEl height
     */
    private getUpdatedRootSizeRatio(rootSizeRatio: number) {
        if (rootSizeRatio <= 0) return 0;
        if (rootSizeRatio >= 100) return 100;
        if (this.chatList.height < SPLIT_OPTIONS.snapOffset * 2) return rootSizeRatio;

        const pixelsToRatio = (pixels: number) => ((pixels + SPLIT_OPTIONS.gutterSize / 2) / this.chatList.height) * 100;

        const isRootSmaller = rootSizeRatio < 50;
        const smallerRatio = isRootSmaller ? rootSizeRatio : 100 - rootSizeRatio;
        const minRatio = pixelsToRatio(SPLIT_OPTIONS.snapOffset);
        if (smallerRatio < minRatio) {
            return isRootSmaller ? minRatio : 100 - minRatio;
        }
        return rootSizeRatio;
    }

    private getRootSizeRatioFromSizes(sizes: number[]) {
        return !this.config.isLocationReversed ? sizes[0] : sizes[1];
    }

    private setRootSizeRatio(rootSizeRatio: number) {
        this.rootSizeRatio.current = rootSizeRatio;
        if (rootSizeRatio) {
            this.rootSizeRatio.lastNonZero = rootSizeRatio;
        }
        rootSizeRatioStore.set(this.rootSizeRatio);
        this.resetRootCollapseTimeout();
    }

    private storeRootSizeRatio(rootSizeRatio: number) {
        if (!this.config.useAutoResize || rootSizeRatio) {
            storeRootSizeRatio(rootSizeRatio);
        }
    }

    private normalizeSplitSizes(sizes: number[]) {
        const ratioToPixels = (ratio: number) => this.chatList.height * (ratio / 100) - SPLIT_OPTIONS.gutterSize / 2;

        const smallerSizeIdx = sizes[0] < sizes[1] ? 0 : 1;

        if (Math.floor(ratioToPixels(sizes[smallerSizeIdx])) <= 0) {
            return smallerSizeIdx === 0 ? [0, 100] : [100, 0];
        }
        return sizes;
    }

    private createSplitSizes(rootSizeRatio: number) {
        const sizes = [rootSizeRatio, 100 - rootSizeRatio];
        if (this.config.isLocationReversed) {
            sizes.reverse();
        }
        return sizes;
    }

    private setSplitterSizesAnimated(rootSizeRatio: number, splitAnimateType: SplitAnimateType) {
        window.clearTimeout(this.chatSplitAnimateTimeout);
        this.splitEls?.forEach(el => el.classList.remove(...SPLIT_ANIMATE_CLASSNAMES));
        this.splitEls?.forEach(el => el.classList.add(createSplitAnimateClassname(splitAnimateType)));

        const updatedRootSizeRatio = this.getUpdatedRootSizeRatio(rootSizeRatio);
        this.splitter?.setSizes(this.createSplitSizes(updatedRootSizeRatio));

        this.chatSplitAnimateTimeout = window.setTimeout(() => {
            this.splitEls?.forEach(el => el.classList.remove(...SPLIT_ANIMATE_CLASSNAMES));
        }, SPLIT_ANIMATION_DURATIONS[splitAnimateType]);

        this.setRootSizeRatio(rootSizeRatio);
    }

    private collapseFilteredChatList(splitAnimateType: SplitAnimateType = 'normal') {
        if (this.isGutterDragged || !this.rootSizeRatio.current) return false;
        this.setSplitterSizesAnimated(0, splitAnimateType);
        return true;
    }

    private expandFilteredChatList(splitAnimateType: SplitAnimateType = 'normal') {
        if (this.isGutterDragged || this.rootSizeRatio.current) return false;
        this.setSplitterSizesAnimated(this.rootSizeRatio.lastNonZero, splitAnimateType);
        return true;
    }

    private handleChatListResize() {
        if (this.isGutterDragged) return;

        if (this.rootSizeRatio.current === 0) {
            this.splitter?.collapse(this.config.isLocationReversed ? 1 : 0);
        } else if (this.rootSizeRatio.current === 100) {
            this.splitter?.collapse(this.config.isLocationReversed ? 0 : 1);
        } else {
            const updatedRootSizeRatio = this.getUpdatedRootSizeRatio(this.rootSizeRatio.current);
            this.splitter?.setSizes(this.createSplitSizes(updatedRootSizeRatio));
        }
    }
    
    private handleFilteredChatListUpdate() {
        if (this.config.useAutoResize) {
            const expanded = this.expandFilteredChatList();
            expanded && this.filteredChatListRoot?.scrollDown();
        }
        this.resetRootCollapseTimeout();
        this.hasFilteredChat = true;
    }

    private setupChatLayout() {
        if (this.splitEls?.every(el => document.contains(el)) && this.splitter) return;

        const chatMessageContainerRootEl = this.chatList.findChatMessageContainerRoot();
        if (!chatMessageContainerRootEl) return;

        chatMessageContainerRootEl.insertAdjacentElement(!this.config.isLocationReversed ? 'beforebegin' : 'afterend', this.rootEl);

        this.splitEls = [this.rootEl, chatMessageContainerRootEl];
        if (this.config.isLocationReversed) {
            this.splitEls.reverse();
        }

        if (this.config.useAutoResize) {
            this.setRootSizeRatio(0);
        } else {
            this.setRootSizeRatio(getStoredRootSizeRatio());
        }

        const initialRootSizeRatio = this.getUpdatedRootSizeRatio(this.rootSizeRatio.current);
        const sizes = this.createSplitSizes(initialRootSizeRatio);

        this.destroySplitter();

        isGutterDraggedStore.set(false);

        this.splitter = Split(this.splitEls, {
            sizes,
            minSize: 0,
            snapOffset: SPLIT_OPTIONS.snapOffset,
            direction: 'vertical',
            cursor: 'ns-resize',
            gutterSize: SPLIT_OPTIONS.gutterSize,
            gutter: (index, direction) => {
                const gutterRootEl = document.createElement('div');
                gutterRootEl.classList.add('tcn-gutter-container');
                const gutter = new ChatListGutter({target: gutterRootEl, props: { direction }});
                this.gutterUnsubscribers.push(
                    gutter.$on('click:resize', () => {
                        this.rootSizeRatio.current ? this.collapseFilteredChatList() : this.expandFilteredChatList();
                    }),
                    gutter.$on('click:share', () => this.emitter.emit('click:share')),
                );
                this.gutters.push(gutter);
                return gutterRootEl;
            },
            onDragStart: () => {
                isGutterDraggedStore.set(true);
                this.splitEls?.forEach(el => el.classList.remove(...SPLIT_ANIMATE_CLASSNAMES));
            },
            onDragEnd: (sizes) => {
                isGutterDraggedStore.set(false);

                if (sizes.length !== 2) return;
                sizes = this.normalizeSplitSizes(sizes);
                const rootSizeRatio = this.getRootSizeRatioFromSizes(sizes);
                this.setRootSizeRatio(rootSizeRatio);
                this.storeRootSizeRatio(rootSizeRatio);
            }, 
        });

        this.filteredChatListRoot?.scrollDown();
    }

    private destroySplitter() {
        this.splitter?.destroy();
        this.splitter = null;
        this.gutterUnsubscribers.forEach(unbind => unbind());
        this.gutterUnsubscribers = [];
        this.gutters.forEach(gutter => gutter.$destroy());
        this.gutters = [];
    }

    private destroy() {
        if (!this.isInitialized) return;
        this.isInitialized = false;

        this.rootEl.remove();

        this.unsubscribers.forEach(unbind => unbind());
        this.unsubscribers = [];
        this.destroySplitter();
        this.splitEls = null;
        this.filteredChatListRoot?.$destroy();

        this.chatList.release();

        window.clearTimeout(this.chatSplitAnimateTimeout);
        window.clearTimeout(this.rootCollapseTimeout);
        this.isIdle = true;
        this.hasFilteredChat = false;
    }
}

let filteredChatView: FilteredChatView | null = null;

const filteredChatViewPromise = new Promise<FilteredChatView>((resolve) => {
    configStore.subscribe(config => {
        if (!config) return;
        if (!filteredChatView) {
            filteredChatView = new FilteredChatView(config);
            return resolve(filteredChatView);
        }
        filteredChatView.setConfig(config);
    });
});

export const getFilteredChatView = async() => filteredChatViewPromise;

