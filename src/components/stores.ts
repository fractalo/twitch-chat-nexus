import { writable } from "svelte/store";
import { DEFAULT_PAGE, pages } from "./pages";
import { isUnknownArray } from "src/util/typePredicates";

export const activePageStore = writable<string>('');

chrome.storage.session.get('activePage').then(({activePage}) => {
    activePageStore.set(Object.hasOwn(pages, activePage) ? activePage : DEFAULT_PAGE);
});

activePageStore.subscribe((activePage) => {
    activePage && chrome.storage.session.set({ activePage });
});


export const isSidebarExpandedStore = writable<boolean>(true);


export const noticedMenuIdsStore = writable<Set<string> | null>(null);

chrome.storage.local.get('noticedMenuIds').then(({noticedMenuIds}) => {
    noticedMenuIdsStore.set(new Set([
        ...(Array.isArray(noticedMenuIds) ? noticedMenuIds : [])
    ]));
});

noticedMenuIdsStore.subscribe((noticedMenuIds) => {
    noticedMenuIds && chrome.storage.local.set({ noticedMenuIds: [...noticedMenuIds] });
});