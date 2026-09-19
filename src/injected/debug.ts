// Opt in from the Twitch page console with localStorage.setItem('TCN_DEBUG', 'true').
// Log summaries only, never headers, cookies or chat bodies.
const isDebugEnabled = () => {
    try {
        return localStorage.getItem('TCN_DEBUG') === 'true';
    } catch {
        return false;
    }
};

export const debugLog = (scope: string, event: string, details?: unknown) => {
    if (!isDebugEnabled()) return;
    console.log(`[TCN][${scope}] ${event}`, details ?? '');
};

export const debugWarn = (scope: string, event: string, details?: unknown) => {
    if (!isDebugEnabled()) return;
    console.warn(`[TCN][${scope}] ${event}`, details ?? '');
};

export const debugFailure = (scope: string, event: string, error: unknown) => {
    if (!isDebugEnabled()) return;
    const log = error instanceof Error && error.name === 'AbortError' ? console.log : console.error;
    log(`[TCN][${scope}] ${event}`, {
        errorName: error instanceof Error ? error.name : typeof error,
        // JSON parser messages can contain snippets of the response body.
        message: error instanceof Error && error.name !== 'SyntaxError' ? error.message : undefined,
    });
};

export const summarizeResponse = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(summarizeResponse);
    if (!value || typeof value !== 'object') return { type: typeof value, isNull: value === null };
    const response = value as { data?: Record<string, unknown>; errors?: { message?: string; path?: unknown }[] };
    return {
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
        errors: Array.isArray(response.errors) ? response.errors.map(error => ({ message: error?.message, path: error?.path })) : [],
    };
};
