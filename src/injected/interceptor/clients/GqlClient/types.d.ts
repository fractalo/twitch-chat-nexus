import type { SafeAny } from "src/util/SafeAny";

export interface GqlRequest {
    extensions?: {
        persistedQuery?: {
            sha256Hash: string;
            version: number;
        }
    }
    operationName?: string;
    variables?: Record<string, unknown>;
    query?: string;
}

export interface GqlResponse {
    data?: SafeAny;
    errors?: {
        message: string;
        path: string[];
    }[];
    extensions?: {
        durationMilliseconds?: number;
        operationName?: string;
        requestID?: string;
    };
}

interface ModifedGqlRequest {
    type: "request";
    request: GqlRequest;
    localResponseHook?: GqlResponseHook;
}

interface FakeGqlResponse {
    type: "response";
    response: Promise<GqlResponse>;
}

export type GqlRequestHook = (request: GqlRequest) => (FakeGqlResponse | ModifedGqlRequest);


export type GqlResponseHook = (request: GqlRequest, response: GqlResponse) => Promise<GqlResponse>;


export interface FakeResponse {
    promise: Promise<GqlResponse>;
    index: number;
}

export interface LocalResponseHook {
    request: GqlRequest;
    hook: GqlResponseHook;
    index: number;
}

export interface FetchOptions {
    signal?: AbortSignal | null;
}


