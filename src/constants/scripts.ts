const PREFIX = "MTC_";

export const scriptIds = {
    contentScript: `${PREFIX}CONTENT_SCRIPT`,
    injectedScript: `${PREFIX}INJECTED_SCRIPT`,
} as const;