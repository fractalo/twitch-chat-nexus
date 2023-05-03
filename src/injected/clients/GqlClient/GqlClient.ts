import { createNanoEvents, type Emitter } from "nanoevents";
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

class GqlClient {
    private emitter: Emitter;
    private requestInit: RequestInit | null;

    private requestHooks: Map<string, GqlRequestHook>;
    private responseHooks: Map<string, GqlResponseHook>;

    constructor() {
        this.emitter = createNanoEvents<Events>();
        this.requestInit = null;

        this.requestHooks = new Map();
        this.responseHooks = new Map();
        

        window.fetch = async(input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const originalRequest = new Request(input, init);
            if (!isTwitchGqlRequest(originalRequest)) {
                return originalFetch(originalRequest);
            }

            this.setRequestInit(originalRequest);

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
                    !(requestHook = this.requestHooks.get(request.operationName))
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
                response = await this.fetch(requestData, { signal: init?.signal });
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

                    const responseHook = this.responseHooks.get(operationName);
                    if (!responseHook) return;

                    try {
                        responseData[i] = await responseHook(origianlRequestDataArray[i], response);
                    } catch {}
                })
            );

            return new Response(JSON.stringify(Array.isArray(originalRequestData) ? responseData : responseData[0]));
        }
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    private setRequestInit(request: Request) {
        !this.requestInit && this.emitter.emit('ready');

        this.requestInit = {
            ...this.requestInit,
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
    }

    private async fetch(data: GqlRequest[], options?: FetchOptions) {
        if (!data.length) {
            return new Response(JSON.stringify([]));
        }
        return originalFetch(API_URL, {
            ...this.requestInit,
            body: JSON.stringify(data),
            signal: options?.signal
        });
    }

    async fetchGqlData(data: GqlRequest[], options?: FetchOptions) {
        const response = await this.fetch(data, options);
        const responseData = await response.json();

        if (!responseData || !Array.isArray(responseData) || responseData.length !== data.length) {
            throw new Error("Invalid GQL response");
        }

        return responseData as GqlResponse[];
    }

    isReady() {
        return !!this.requestInit;
    }

    setRequestHook(operationName: string, hook: GqlRequestHook) {
        this.requestHooks.set(operationName, hook);
    }

    deleteRequestHook(operationName: string) {
        this.requestHooks.delete(operationName);
    }

    setResponseHook(operationName: string, hook: GqlResponseHook) {
        this.responseHooks.set(operationName, hook);
    }

    deleteResponseHook(operationName: string) {
        this.responseHooks.delete(operationName);
    }
}

let gqlClient: GqlClient | undefined;

export const getGqlClient = () => {
    if (!gqlClient) {
        gqlClient = new GqlClient();
    }
    return gqlClient;
}