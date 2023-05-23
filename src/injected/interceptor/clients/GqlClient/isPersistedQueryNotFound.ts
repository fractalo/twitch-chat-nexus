import type { GqlResponse } from "./types";

export const isPersistedQueryNotFound = (response: GqlResponse) => {
    return response.errors &&
        response.errors.length === 1 &&
        response.errors[0].message === 'PersistedQueryNotFound';
}