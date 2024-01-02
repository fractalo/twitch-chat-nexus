export const CURRENT_NOTICE_ID: number = 1;

const VIEWED_APP_NOTICE_ID_STORAGE_KEY = 'tcn_viewed_app_notice_id';

const DEFAULT_VIEWED_APP_NOTICE_ID: number = CURRENT_NOTICE_ID - 1;


export const getValidViewedAppNoticeId = (value: unknown, fallback: number) => {
    const id = Math.floor(Number(value));
    if (id > CURRENT_NOTICE_ID) {
        return fallback;
    }
    return id;
};

export const getStoredViewedAppNoticeId = (): number => {
    const value = localStorage.getItem(VIEWED_APP_NOTICE_ID_STORAGE_KEY);
    if (!value) {
        return DEFAULT_VIEWED_APP_NOTICE_ID;
    }
    return getValidViewedAppNoticeId(value, DEFAULT_VIEWED_APP_NOTICE_ID);
};

export const storeViewedAppNoticeId = (appNoticeId: number) => {
    localStorage.setItem(VIEWED_APP_NOTICE_ID_STORAGE_KEY, appNoticeId.toString());
};

