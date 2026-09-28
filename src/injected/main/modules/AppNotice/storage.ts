export const CURRENT_NOTICE_ID: number = 2;
// Update this deadline when publishing a new notice.
export const CURRENT_NOTICE_EXPIRES_AT = Date.parse('2026-11-28T00:00:00+09:00');

const VIEWED_APP_NOTICE_ID_STORAGE_KEY = 'tcn_viewed_app_notice_id';

const DEFAULT_VIEWED_APP_NOTICE_ID: number = 1;


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

