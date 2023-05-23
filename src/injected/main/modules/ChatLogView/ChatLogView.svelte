<script lang="ts">
    import { faRotateRight, faForwardStep, faBackwardStep, faAngleLeft, faAngleRight, faGear } from '@fortawesome/free-solid-svg-icons';
    import Tooltip from "../../components/Tooltip.svelte";
    import IconButton from "../../components/IconButton.svelte";
    import { DEFAULT_SORT_ORDER, PAGE_SIZES, CHAT_LOG_OPERATION_NAME, DEFAULT_PAGE_SIZE } from './constants';

    import { isPersistedQueryNotFound } from "src/injected/interceptor/clients/GqlClient/isPersistedQueryNotFound";
    import { createModLogsMessagesRequest, filterEdges, modLogsMessagesQuery, type ModLogsMessagesGqlRequest } from "src/injected/interceptor/clients/GqlClient/operations/TCH_ViewerCardModLogsMessagesBySender";
    import type { GqlRequest, GqlResponse } from "src/injected/interceptor/clients/GqlClient/types";
    import { isRecord } from "src/util/SafeAny";
    import { assignPropertyIfValid } from "src/util/assignPropertyIfValid";
    import { chatLogStyleState, requestConfig } from './stores';
    import { i18n } from 'src/i18n';
    import type { GqlClient } from 'src/injected/interceptor/clients/GqlClient';

    export let refreshMessagesTab: (() => void);
    export let gqlClient: GqlClient;

    let screenWidth: number;

    let hasNeverTriggeredChatlogFetch = true;

    const triggerChatLogFetch = () => {
        hasNeverTriggeredChatlogFetch = false;
        refreshMessagesTab();
    };



    let prevPageCursor: string | null = null;
    let nextPageCursor: string | null = null;

    let isFirstPage = true;
    let isLastPage = true;

    let hasMorePage = false;

    let isPaginationEnabled = false;

    const handlePaginationToggle = () => {
        $requestConfig.sortOrder = DEFAULT_SORT_ORDER;
        $requestConfig.cursor = null;
        prevPageCursor = null;
        nextPageCursor = null;
        hasMorePage = false;
        triggerChatLogFetch();
    };

    const fetchFirstPage = () => {
        $requestConfig.sortOrder = 'DESC';
        $requestConfig.cursor = null;
        setTimeout(triggerChatLogFetch, 10);
    };

    const fetchLastPage = () => {
        $requestConfig.sortOrder = 'ASC';
        $requestConfig.cursor = null;
        setTimeout(triggerChatLogFetch, 10);
    };

    const fetchPrevPage = () => {
        if (!prevPageCursor) {
            return fetchFirstPage();
        }
        $requestConfig.sortOrder = 'ASC';
        $requestConfig.cursor = prevPageCursor;
        setTimeout(triggerChatLogFetch, 10);
    };

    const fetchNextPage = () => {
        if (!nextPageCursor) {
            return fetchLastPage();
        }
        $requestConfig.sortOrder = 'DESC';
        $requestConfig.cursor = nextPageCursor;
        setTimeout(triggerChatLogFetch, 10);
    };
    
    const refreshPage = () => {
        if (isFirstPage) {
            $requestConfig.sortOrder = 'DESC';
            $requestConfig.cursor = null;
        } else if (isLastPage) {
            $requestConfig.sortOrder = 'ASC';
            $requestConfig.cursor = null;
        }
        triggerChatLogFetch();
    }

    $: {
        if ($requestConfig.sortOrder === 'DESC') {
            isFirstPage = !$requestConfig.cursor;
            isLastPage = !nextPageCursor;
        } else {
            isFirstPage = !prevPageCursor;
            isLastPage = !$requestConfig.cursor;
        }
    }



    let isSettingsMenuOpen = false;
    let settingsElement: HTMLElement | null = null;

    const handleSettingsButtonClick = () => {
        isSettingsMenuOpen = !isSettingsMenuOpen;
    };

    const handleSettingsOutsideClick = (event: MouseEvent) => {
        if (
            event.isTrusted &&
            isSettingsMenuOpen && 
            event.target instanceof Node && 
            !settingsElement?.contains(event.target)
        ) {
            isSettingsMenuOpen = false;
        }
    };

    document.addEventListener('click', handleSettingsOutsideClick);
    
    


    const chatUsernameStyleEl = document.createElement('style');
    chatUsernameStyleEl.textContent = `.message-author__username { display: none; }`;

    const handleUsernameToggle = () => {
        if ($chatLogStyleState.hideChatUsername) {
            document.head.append(chatUsernameStyleEl);
        } else {
            chatUsernameStyleEl.remove();
        }
    };

    const checkHasMorePage = async(request: ModLogsMessagesGqlRequest, signal?: AbortSignal | null) => {
        let response: GqlResponse;
        try {
            [response] = await gqlClient.fetchGqlData([request], { signal });
        } catch {
            return false;
        }

        const messagesBySender = response?.data?.channel?.modLogs?.messagesBySender as unknown;

        return isRecord(messagesBySender) &&
            Array.isArray(messagesBySender.edges) &&
            !!filterEdges(messagesBySender.edges, request.variables).length;
    };

    const fetchChatLog = async({channelLogin, senderID, signal}: {channelLogin: string, senderID: string, signal?: AbortSignal | null;}): Promise<GqlResponse> => {
        const variables = {
            channelLogin,
            senderID,
            first: $requestConfig.pageSize,
            order: $requestConfig.sortOrder,
            cursor: $requestConfig.cursor
        };

        const request = await createModLogsMessagesRequest(variables);

        let response: GqlResponse;
        try {
            for (let i = 0; ; ++i) {
                [response] = await gqlClient.fetchGqlData([request], { signal });

                if (isPersistedQueryNotFound(response)) {
                    if (i >= 1) throw new Error(`PersistedQueryNotFound`);
                    request.query = modLogsMessagesQuery;
                } else {
                    break;
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error(error.message);
            }
            return {};
        }

        if (response.extensions) {
            response.extensions.operationName = CHAT_LOG_OPERATION_NAME;
        }

        const messagesBySender = response?.data?.channel?.modLogs?.messagesBySender as unknown;

        if (isRecord(messagesBySender) && Array.isArray(messagesBySender.edges)) {
            const edges = filterEdges(messagesBySender.edges, variables);

            hasMorePage = Boolean(response?.data?.channel?.modLogs?.messagesBySender?.pageInfo?.hasNextPage);

            /* check really don't have more page. */
            if (!hasMorePage && variables.cursor && edges[edges.length - 1]?.cursor) {
                hasMorePage = await checkHasMorePage({
                    ...request,
                    variables: {
                        ...variables,
                        first: DEFAULT_PAGE_SIZE,
                        cursor: edges[edges.length - 1].cursor
                    }
                }, signal);
            }

            /* make edges order to DESC */
            if (variables.order === 'ASC') {
                edges.reverse();
            }

            const firstCursor = edges[0]?.cursor || null;
            const lastCursor = edges[edges.length - 1]?.cursor || null;

            if (variables.order === 'DESC') {
                prevPageCursor = variables.cursor ? firstCursor : null;
                nextPageCursor = hasMorePage ? lastCursor : null; 
            } else {
                prevPageCursor = hasMorePage ? firstCursor : null;
                nextPageCursor = variables.cursor ? lastCursor : null;
            }

            messagesBySender.edges = edges;
        }

        /* prevent infinite scrolling */
        if (!assignPropertyIfValid(response?.data?.channel?.modLogs?.messagesBySender?.pageInfo, 'hasNextPage', false)) {
            console.log(`could not modify hasNextPage of ${CHAT_LOG_OPERATION_NAME} response`);
        }

        return response;
    }

    let prevAbortController: AbortController | undefined;

    gqlClient.setRequestHook(CHAT_LOG_OPERATION_NAME, (request: GqlRequest) => {
        const abortController = new AbortController();
        prevAbortController?.abort();
        prevAbortController = abortController;

        if (
            !request.variables ||
            !request.variables?.channelLogin ||
            !request.variables?.senderID ||
            typeof request.variables.channelLogin !== 'string' ||
            typeof request.variables.senderID !== 'string'
        ) {
            console.warn(`[${CHAT_LOG_OPERATION_NAME}] unknown variables: ${request.variables}`);
            return { type: "response", response: gqlClient.fetchGqlData([request], {signal: abortController.signal}).then(response => response[0]) };
        }
        
        if (
            request.variables.cursor ||
            !isPaginationEnabled
        ) {
            return { type: "response", response: gqlClient.fetchGqlData([request], {signal: abortController.signal}).then(response => response[0]) };
        }

        const response = fetchChatLog({
            channelLogin: request.variables.channelLogin,
            senderID: request.variables.senderID,
            signal: abortController.signal
        });

        return { type: "response", response };
    });
    
</script>


<svelte:window bind:innerWidth={screenWidth} />


<div class="flex flex-row-reverse flex-wrap-reverse items-center h-full ml-2 py-2 gap-4">
    <div class="flex">
        <Tooltip text={$i18n.t('chatLogView.refreshButton')}>
            <IconButton type="ghost" icon={faRotateRight} handleClick={refreshPage} />
        </Tooltip>

        <div 
            bind:this={settingsElement}
        >
            <Tooltip text={$i18n.t('chatLogView.settingsButton')}>
                <IconButton type="ghost" icon={faGear} handleClick={handleSettingsButtonClick} />
            </Tooltip>

            {#if isSettingsMenuOpen}
            <div class="flex flex-col p-4 tw-shadow bg-base-100 rounded-box w-[22rem] absolute right-0 z-40 mt-3">
                <div class="daisy-form-control">
                    <label class="daisy-label cursor-pointer p-0">
                        <span class="daisy-label-text mr-2">{$i18n.t('chatLogView.paginationToggle')}</span> 
                        <input type="checkbox" class="daisy-toggle daisy-toggle-primary" 
                            bind:checked={isPaginationEnabled} 
                            on:change={handlePaginationToggle}
                        />
                    </label>
                </div>
                {#if isPaginationEnabled && screenWidth < 600}
                    <div class="daisy-form-control ml-6 mb-2">
                        <label for="pageSize" class="daisy-label">
                            <span class="daisy-label-text">{$i18n.t('chatLogView.pageSize.label')}</span>
                        </label>
                        <select id="pageSize" class="daisy-select"
                            bind:value={$requestConfig.pageSize} 
                            on:change={triggerChatLogFetch}
                        >
                            {#each PAGE_SIZES as size}
                                <option value={size}>{size.toLocaleString('en-US')}{$i18n.t('chatLogView.pageSize.suffix')}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <div class="daisy-form-control">
                    <label class="daisy-label cursor-pointer p-0">
                        <span class="daisy-label-text mr-2">{$i18n.t('chatLogView.chatUsernameToggle')}</span> 
                        <input type="checkbox" class="daisy-toggle daisy-toggle-primary" 
                            bind:checked={$chatLogStyleState.hideChatUsername}
                            on:change={handleUsernameToggle}
                        />
                    </label>
                </div>
            </div>
            {/if}
        </div>
    </div>


    {#if isPaginationEnabled}
    <div class="flex gap-2 items-center">
        <Tooltip text={$i18n.t('chatLogView.paginationButtons.first.tooltip')}>
            <IconButton type="primary" icon={faBackwardStep} handleClick={fetchFirstPage} disabled={isFirstPage} />
        </Tooltip>
        {#if screenWidth >= 400}
            <IconButton type="primary" icon={faAngleLeft} text={$i18n.t('chatLogView.paginationButtons.previous.label')} textPosition="right" handleClick={fetchPrevPage} disabled={isFirstPage} />
            <IconButton type="primary" icon={faAngleRight} text={$i18n.t('chatLogView.paginationButtons.next.label')} textPosition="left" handleClick={fetchNextPage} disabled={isLastPage} />
        {:else}
            <Tooltip text={$i18n.t('chatLogView.paginationButtons.previous.tooltip')}>
                <IconButton type="primary" icon={faAngleLeft} handleClick={fetchPrevPage} disabled={isFirstPage} />
            </Tooltip>
            <Tooltip text={$i18n.t('chatLogView.paginationButtons.next.tooltip')}>
                <IconButton type="primary" icon={faAngleRight} handleClick={fetchNextPage} disabled={isLastPage} />
            </Tooltip>
        {/if}
        <Tooltip text={$i18n.t('chatLogView.paginationButtons.last.tooltip')}>
            <IconButton type="primary" icon={faForwardStep} handleClick={fetchLastPage} disabled={isLastPage} />
        </Tooltip>

        {#if screenWidth >= 600}
            <Tooltip text={$i18n.t('chatLogView.pageSize.label')}>
                <select class="daisy-select ml-2"
                    bind:value={$requestConfig.pageSize} 
                    on:change={triggerChatLogFetch}
                >
                    {#each PAGE_SIZES as size}
                        <option value={size}>{size.toLocaleString('en-US')}{$i18n.t('chatLogView.pageSize.suffix')}</option>
                    {/each}
                </select>
            </Tooltip>
        {/if}
    </div>
    {/if}
</div>


<style>
    span,
    select {
        font-family: inherit;
        font-size: 1.3rem;
    }

    .daisy-select {
        font-weight: 400;
    }

    .tw-shadow {
        box-shadow: var(--shadow-elevation-2);
    }

    .daisy-form-control {
        padding: 0.5rem;
    }

</style>