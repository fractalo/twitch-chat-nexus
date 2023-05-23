import { createNanoEvents } from "nanoevents";
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
    const emitter = createNanoEvents<Events>();
    let requestInit: RequestInit | null = null;

    const requestHooks = new Map<string, GqlRequestHook>();
    const responseHooks = new Map<string, GqlResponseHook>();


    const setRequestInit = (request: Request) => {
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

    const fetchGql = async(data: GqlRequest[], options?: FetchOptions) => {
        if (!data.length) {
            return new Response(JSON.stringify([]));
        }
        return originalFetch(API_URL, {
            ...requestInit,
            body: JSON.stringify(data),
            signal: options?.signal
        });
    };


    window.fetch = async(input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const originalRequest = new Request(input, init);
        if (!isTwitchGqlRequest(originalRequest)) {
            return originalFetch(originalRequest);
        }

        setRequestInit(originalRequest);

        const originalRequestData = await originalRequest.json().catch(() => {}) as GqlRequest | GqlRequest[];
        if (
            !originalRequestData || 
            (Array.isArray(originalRequestData) && !originalRequestData.length)
        ) {
            return originalFetch(input, init);
        }


        const origianlRequestDataArray = Array.isArray(originalRequestData) ? originalRequestData : [originalRequestData];

        const requestData: GqlRequest[] = [];
        const fakeResponses: FakeResponse[] = [];
        const localResponseHooks: LocalResponseHook[] = [];

        origianlRequestDataArray.forEach((request, i) => {
            let requestHook: GqlRequestHook | undefined;
            if (
                !request.operationName || 
                !(requestHook = requestHooks.get(request.operationName))
            ) {
                requestData.push(request);
                return;
            }          

            try {
                const result = requestHook(request);
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
                requestData.push(request);
            }
        });


        let response: Response;
        try {
            response = await fetchGql(requestData, { signal: init?.signal });
        } catch (error) {
            return Promise.reject(error);
        }

        const responseData = await response.clone().json().catch(() => {}) as GqlResponse[];
        if (
            !responseData || 
            !Array.isArray(responseData) ||
            responseData.length !== requestData.length
        ) {
            return response;
        }

        /* restore response array length */
        fakeResponses.forEach((fakeResponse) => {
            responseData.splice(fakeResponse.index, 0, {});
        })

        await Promise.all([
            ...fakeResponses.map(async(fakeResponse) => {
                try {
                    responseData[fakeResponse.index] = await fakeResponse.promise;
                } catch {}
            }),
            ...localResponseHooks.map(async(localResponseHook) => {
                const { request, hook, index } = localResponseHook;
                try {
                    responseData[index] = await hook(request, responseData[index]);
                } catch {}
            })
        ]);

        await Promise.all(
            responseData.map(async(response, i) => {
                const operationName = response.extensions?.operationName || origianlRequestDataArray[i].operationName;
                if (!operationName) return;

                const responseHook = responseHooks.get(operationName);
                if (!responseHook) return;

                try {
                    responseData[i] = await responseHook(origianlRequestDataArray[i], response);
                } catch {}
            })
        );

        return new Response(JSON.stringify(Array.isArray(originalRequestData) ? responseData : responseData[0]));
    }


    const on = <E extends keyof Events>(event: E, callback: Events[E]) => {
        return emitter.on(event, callback);
    };

    const fetchGqlData = async(data: GqlRequest[], options?: FetchOptions) => {
        const response = await fetchGql(data, options);
        const responseData = await response.json();

        if (!responseData || !Array.isArray(responseData) || responseData.length !== data.length) {
            throw new Error("Invalid GQL response");
        }

        return responseData as GqlResponse[];
    };

    const isReady = () => !!requestInit;

    const setRequestHook = (operationName: string, hook: GqlRequestHook) => {
        requestHooks.set(operationName, hook);
    };

    const deleteRequestHook = (operationName: string) => {
        requestHooks.delete(operationName);
    };

    const setResponseHook = (operationName: string, hook: GqlResponseHook) => {
        responseHooks.set(operationName, hook);
    };

    const deleteResponseHook = (operationName: string) => {
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