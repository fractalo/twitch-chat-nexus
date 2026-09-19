import { createNanoEvents } from "nanoevents";
import { debugLog, debugWarn, debugFailure, summarizeResponse } from '../../../debug';
import { API_URL } from "./constants";
import { isTwitchGqlRequest } from "./isTwitchGqlRequest";
import type { 
    FakeResponse, 
    FetchOptions, 
    GqlRequest, 
    GqlRequestHook, 
    GqlResponse, 
    GqlResponseHook, 
    LocalResponseHook
} from "./types";


const originalFetch = window.fetch;


interface Events {
    ready: () => void;
}

export interface GqlClient {
    on<E extends keyof Events>(event: E, callback: Events[E]): void;
    fetchGqlData(data: GqlRequest[], options?: FetchOptions): Promise<GqlResponse[]>;
    isReady(): boolean;
    setRequestHook(operationName: string, hook: GqlRequestHook): void;
    deleteRequestHook(operationName: string): void;
    setResponseHook(operationName: string, hook: GqlResponseHook): void;
    deleteResponseHook(operationName: string): void;
}

const createGqlClient = (): GqlClient => {
    debugLog('GQL', 'Creating client and installing fetch interceptor');
    let sequence = 0;
    const emitter = createNanoEvents<Events>();
    let requestInit: RequestInit | null = null;

    const requestHooks = new Map<string, GqlRequestHook>();
    const responseHooks = new Map<string, GqlResponseHook>();


    const setRequestInit = (request: Request) => {
        debugLog('GQL', 'Capturing request settings', { firstCapture: !requestInit, method: request.method });
        if (!requestInit) debugLog('GQL', 'Emitting ready (before request settings assignment)');
        !requestInit && emitter.emit('ready');

        requestInit = {
            ...requestInit,
            cache: request.cache,
            credentials: request.credentials,
            headers: request.headers,
            integrity: request.integrity,
            keepalive: request.keepalive,
            method: request.method,
            mode: request.mode,
            redirect: request.redirect,
            referrer: request.referrer,
            referrerPolicy: request.referrerPolicy
        };
    };

    const fetchGql = async(data: GqlRequest[], options?: FetchOptions, parentId?: string) => {
        const scope = `${parentId ?? 'GQL/direct'}/network-${++sequence}`;
        const start = performance.now();
        debugLog(scope, 'Sending operations', { operations: data.map(item => item?.operationName), hasRequestSettings: !!requestInit, aborted: options?.signal?.aborted });
        if (!data.length) {
            debugLog(scope, 'No network operations; returning empty batch');
            return new Response(JSON.stringify([]));
        }
        try {
            const response = await originalFetch(API_URL, {
                ...requestInit,
                body: JSON.stringify(data),
                signal: options?.signal
            });
            debugLog(scope, 'HTTP response', { status: response.status, ok: response.ok, elapsedMs: Math.round(performance.now() - start) });
            return response;
        } catch (error) {
            debugFailure(scope, 'Network request failed', error);
            throw error;
        }
    };


    window.fetch = async(input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const originalRequest = new Request(input, init);
        if (!isTwitchGqlRequest(originalRequest)) {
            if (new URL(originalRequest.url).hostname === new URL(API_URL).hostname) {
                debugLog('GQL', 'GQL host request skipped by matcher', { path: new URL(originalRequest.url).pathname, method: originalRequest.method });
            }
            return originalFetch(originalRequest);
        }

        const scope = `GQL/request-${++sequence}`;
        debugLog(scope, 'Intercepted request', { inputType: input instanceof Request ? 'Request' : typeof input, method: originalRequest.method });

        setRequestInit(originalRequest);

        const originalRequestData = await originalRequest.json().catch(error => { debugFailure(scope, 'Request JSON parsing failed', error); }) as GqlRequest | GqlRequest[];
        if (
            !originalRequestData || 
            (Array.isArray(originalRequestData) && !originalRequestData.length)
        ) {
            debugLog(scope, 'Empty or invalid request body; forwarding original input');
            return originalFetch(input, init);
        }


        const origianlRequestDataArray = Array.isArray(originalRequestData) ? originalRequestData : [originalRequestData];
        debugLog(scope, 'Parsed operations', { batch: Array.isArray(originalRequestData), operations: origianlRequestDataArray.map(request => request?.operationName) });

        const requestData: GqlRequest[] = [];
        const fakeResponses: FakeResponse[] = [];
        const localResponseHooks: LocalResponseHook[] = [];

        origianlRequestDataArray.forEach((request, i) => {
            let requestHook: GqlRequestHook | undefined;
            if (
                !request.operationName || 
                !(requestHook = requestHooks.get(request.operationName))
            ) {
                debugLog(scope, 'No request hook; forwarding operation', { index: i, operation: request.operationName });
                requestData.push(request);
                return;
            }          

            try {
                debugLog(scope, 'Request hook started', { index: i, operation: request.operationName });
                const result = requestHook(request);
                debugLog(scope, 'Request hook completed', { index: i, operation: request.operationName, resultType: result.type });
                switch (result.type) {
                    case 'request': {
                        requestData.push(result.request);
                        if (result.localResponseHook) {
                            localResponseHooks.push({
                                request: result.request,
                                hook: result.localResponseHook,
                                index: i
                            });
                        }
                        break;
                    }
                    case 'response': {
                        result.response.catch(() => {});
                        fakeResponses.push({ promise: result.response, index: i });
                        break;
                    }
                    default:
                        throw new Error(`Invalid request hook result type`);
                }
            } catch (err) {
                debugFailure(scope, `Request hook failed; forwarding original operation at index ${i}`, err);
                requestData.push(request);
            }
        });


        let response: Response;
        try {
            response = await fetchGql(requestData, { signal: init?.signal }, scope);
        } catch (error) {
            return Promise.reject(error);
        }

        const responseData = await response.clone().json().catch(error => { debugFailure(scope, 'Response JSON parsing failed', error); }) as GqlResponse[];
        debugLog(scope, 'Parsed response', summarizeResponse(responseData));
        if (
            !responseData || 
            !Array.isArray(responseData) ||
            responseData.length !== requestData.length
        ) {
            debugWarn(scope, 'Response shape/count mismatch; returning network response without hooks', { expected: requestData.length, actual: Array.isArray(responseData) ? responseData.length : null });
            return response;
        }

        /* restore response array length */
        debugLog(scope, 'Restoring batch', { fakeResponses: fakeResponses.length, localResponseHooks: localResponseHooks.length });
        fakeResponses.forEach((fakeResponse) => {
            responseData.splice(fakeResponse.index, 0, {});
        })

        await Promise.all([
            ...fakeResponses.map(async(fakeResponse) => {
                try {
                    responseData[fakeResponse.index] = await fakeResponse.promise;
                    debugLog(scope, 'Replacement response resolved', { index: fakeResponse.index, response: summarizeResponse(responseData[fakeResponse.index]) });
                } catch (error) { debugFailure(scope, `Replacement response failed at index ${fakeResponse.index}`, error); }
            }),
            ...localResponseHooks.map(async(localResponseHook) => {
                const { request, hook, index } = localResponseHook;
                try {
                    debugLog(scope, 'Local response hook started', { index });
                    responseData[index] = await hook(request, responseData[index]);
                    debugLog(scope, 'Local response hook completed', { index });
                } catch (error) { debugFailure(scope, `Local response hook failed at index ${index}`, error); }
            })
        ]);

        await Promise.all(
            responseData.map(async(response, i) => {
                const operationName = response.extensions?.operationName || origianlRequestDataArray[i].operationName;
                if (!operationName) { debugLog(scope, 'Response has no operation name', { index: i }); return; }

                const responseHook = responseHooks.get(operationName);
                if (!responseHook) { debugLog(scope, 'No response hook', { index: i, operationName }); return; }

                try {
                    debugLog(scope, 'Response hook started', { index: i, operationName });
                    responseData[i] = await responseHook(origianlRequestDataArray[i], response);
                    debugLog(scope, 'Response hook completed', { index: i, operationName });
                } catch (error) { debugFailure(scope, `Response hook failed: ${operationName}`, error); }
            })
        );

        debugLog(scope, 'Returning reconstructed response', { count: responseData.length, batch: Array.isArray(originalRequestData) });
        return new Response(JSON.stringify(Array.isArray(originalRequestData) ? responseData : responseData[0]));
    }
    debugLog('GQL', 'Fetch interceptor installed');


    const on = <E extends keyof Events>(event: E, callback: Events[E]) => {
        return emitter.on(event, callback);
    };

    const fetchGqlData = async(data: GqlRequest[], options?: FetchOptions) => {
        const response = await fetchGql(data, options);
        const responseData = await response.json().catch(error => {
            debugFailure('GQL/direct', 'Response JSON parsing failed', error);
            throw error;
        });
        debugLog('GQL/direct', 'Parsed direct response', { operations: data.map(item => item.operationName), response: summarizeResponse(responseData) });

        if (!responseData || !Array.isArray(responseData) || responseData.length !== data.length) {
            debugWarn('GQL/direct', 'Invalid response shape/count', { expected: data.length, actual: Array.isArray(responseData) ? responseData.length : null });
            throw new Error("Invalid GQL response");
        }

        return responseData as GqlResponse[];
    };

    const isReady = () => !!requestInit;

    const setRequestHook = (operationName: string, hook: GqlRequestHook) => {
        debugLog('GQL', 'Registering request hook', { operationName, replacing: requestHooks.has(operationName) });
        requestHooks.set(operationName, hook);
    };

    const deleteRequestHook = (operationName: string) => {
        debugLog('GQL', 'Deleting request hook', { operationName });
        requestHooks.delete(operationName);
    };

    const setResponseHook = (operationName: string, hook: GqlResponseHook) => {
        debugLog('GQL', 'Registering response hook', { operationName, replacing: responseHooks.has(operationName) });
        responseHooks.set(operationName, hook);
    };

    const deleteResponseHook = (operationName: string) => {
        debugLog('GQL', 'Deleting response hook', { operationName });
        responseHooks.delete(operationName);
    };

    return {
        on, 
        fetchGqlData, 
        isReady, 
        setRequestHook, 
        deleteRequestHook,
        setResponseHook,
        deleteResponseHook,
    };
};

let gqlClient: GqlClient | undefined;

export const getGqlClient = () => {
    if (!gqlClient) {
        gqlClient = createGqlClient();
    }
    return gqlClient;
};
