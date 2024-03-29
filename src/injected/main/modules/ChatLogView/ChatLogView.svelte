<script lang="ts">
    import { faRotateRight, faBackwardStep, faAngleLeft, faAngleRight, faGear } from '@fortawesome/free-solid-svg-icons';
    import Tooltip from "../../components/Tooltip.svelte";
    import IconButton from "../../components/IconButton.svelte";
    import { PAGE_SIZES, CHAT_LOG_OPERATION_NAME, DEFAULT_PAGE_SIZE } from './constants';
    import { isPersistedQueryNotFound } from "src/injected/interceptor/clients/GqlClient/isPersistedQueryNotFound";
    import { createModLogsMessagesRequest, filterEdges, modLogsMessagesQuery, type ModLogsMessagesGqlRequest } from "src/injected/interceptor/clients/GqlClient/operations/TCN_ViewerCardModLogsMessagesBySender";
    import type { GqlRequest, GqlResponse } from "src/injected/interceptor/clients/GqlClient/types";
    import { isRecord } from "src/util/typePredicates";
    import { assignPropertyIfValid } from "src/util/assignPropertyIfValid";
    import { chatLogStyleState, requestConfig } from './stores';
    import { i18n } from 'src/i18n';
    import type { GqlClient } from 'src/injected/interceptor/clients/GqlClient';
    import Dropdown from '../../components/Dropdown.svelte';
  import DropdownTooltipIconButton from '../../components/DropdownTooltipIconButton.svelte';

    export let refreshMessagesTab: (() => void);
    export let gqlClient: GqlClient;

    let screenWidth: number;

    let hasNeverTriggeredChatlogFetch = true;

    const triggerChatLogFetch = () => {
        hasNeverTriggeredChatlogFetch = false;
        refreshMessagesTab();
    };

    /**
     * Stack used to return to the previous page.
     * last element is always current page cursor.
     */
    let prevPageCursors: string[] = [];

    let nextPageCursor: string | null = null;

    let isFirstPage = true;
    let isLastPage = true;

    let isPaginationEnabled = false;

    const fetchFirstPage = () => {
        $requestConfig.direction = 'next';
        $requestConfig.cursor = null;
        prevPageCursors = [];
        nextPageCursor = null;
        setTimeout(triggerChatLogFetch, 10);
    };

    const fetchPrevPage = () => {
        if (prevPageCursors.length <= 1) {
            return fetchFirstPage();
        }
        $requestConfig.direction = 'previous';
        $requestConfig.cursor = prevPageCursors[prevPageCursors.length - 2];
        setTimeout(triggerChatLogFetch, 10);
    };

    const fetchNextPage = () => {
        $requestConfig.direction = 'next';
        $requestConfig.cursor = nextPageCursor;
        setTimeout(triggerChatLogFetch, 10);
    };
    
    const refreshPage = () => {
        if (isFirstPage) {
            return fetchFirstPage();
        }
        triggerChatLogFetch();
    }

    $: {
        isFirstPage = !$requestConfig.cursor;
        isLastPage = !nextPageCursor;
    }


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

        const messages = response?.data?.viewerCardModLogs?.messages as unknown;

        return isRecord(messages) &&
            Array.isArray(messages.edges) &&
            !!filterEdges(messages.edges, request.variables).length;
    };

    const fetchChatLog = async({channelID, senderID, signal}: {channelID: string, senderID: string, signal?: AbortSignal | null;}): Promise<GqlResponse> => {
        const variables = {
            channelID,
            senderID,
            first: $requestConfig.pageSize,
            cursor: $requestConfig.cursor
        };
        const paginationDirection = $requestConfig.direction;

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

        const messages = response?.data?.viewerCardModLogs?.messages as unknown;

        if (isRecord(messages) && Array.isArray(messages.edges)) {
            const edges = filterEdges(messages.edges, variables);

            let hasMorePage = Boolean(response?.data?.viewerCardModLogs?.messages?.pageInfo?.hasNextPage);

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

            const lastCursor = edges[edges.length - 1]?.cursor || null;

            nextPageCursor = hasMorePage ? lastCursor : null;

            /* Make the last element of prevPageCursors always point to the cursor on the current page. */
            if (paginationDirection === 'next') {
                if (
                    !prevPageCursors.length || 
                    prevPageCursors[prevPageCursors.length - 1] !== variables.cursor
                ) {
                    variables.cursor && prevPageCursors.push(variables.cursor);
                }
            } else {
                if (
                    prevPageCursors.length && 
                    prevPageCursors[prevPageCursors.length - 1] !== variables.cursor
                ) {
                    prevPageCursors.pop()
                }
            }
            
            messages.edges = edges;
        }

        /* prevent infinite scrolling */
        if (!assignPropertyIfValid(response?.data?.viewerCardModLogs?.messages?.pageInfo, 'hasNextPage', false)) {
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
            !request.variables?.channelID ||
            !request.variables?.senderID ||
            typeof request.variables.channelID !== 'string' ||
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

        return { 
            type: "response", 
            response: fetchChatLog({
                channelID: request.variables.channelID,
                senderID: request.variables.senderID,
                signal: abortController.signal
            })
        };
    });
    
</script>


<svelte:window bind:innerWidth={screenWidth} />


<div class="flex flex-row-reverse flex-wrap-reverse items-center h-full ml-2 py-2 gap-4">
    <div class="flex">
        <Tooltip text={$i18n.t('refresh')}>
            <IconButton type="ghost" icon={faRotateRight} on:click={refreshPage} />
        </Tooltip>

        <Dropdown>
            <DropdownTooltipIconButton 
                slot="button"
                let:toggleDropdown
                let:isDropdownOpen
                {toggleDropdown}
                {isDropdownOpen}

                tooltipText={$i18n.t('chatLogView.settings', { ns: 'mainApp' })}
                tooltipPlacement="top"

                buttonType="ghost"
                buttonIcon={faGear}
            />

            <div slot="body" class="tcn-card flex flex-col px-4 pt-2 pb-4 rounded-box w-[22rem] absolute right-0 z-40">
                <div class="flex w-full justify-center py-2 mb-2">
                    <span class="tcn-card-title-sm">{$i18n.t('chatLogView.settings', { ns: 'mainApp' })}</span>
                </div>
                <div class="daisy-form-control">
                    <label class="daisy-label cursor-pointer p-0">
                        <span class="daisy-label-text mr-2">{$i18n.t('chatLogView.paginationToggle', { ns: 'mainApp' })}</span> 
                        <input type="checkbox" class="daisy-toggle daisy-toggle-primary" 
                            bind:checked={isPaginationEnabled} 
                            on:change={fetchFirstPage}
                        />
                    </label>
                </div>
                {#if isPaginationEnabled && screenWidth < 530}
                    <div class="daisy-form-control ml-6 mb-2">
                        <label for="pageSize" class="daisy-label">
                            <span class="daisy-label-text">{$i18n.t('chatLogView.pageSize.label', { ns: 'mainApp' })}</span>
                        </label>
                        <select id="pageSize" class="daisy-select"
                            bind:value={$requestConfig.pageSize} 
                            on:change={fetchFirstPage}
                        >
                            {#each PAGE_SIZES as size}
                                <option value={size}>{size.toLocaleString('en-US')}{$i18n.t('chatLogView.pageSize.suffix', { ns: 'mainApp' })}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <div class="daisy-form-control">
                    <label class="daisy-label cursor-pointer p-0">
                        <span class="daisy-label-text mr-2">{$i18n.t('chatLogView.chatUsernameToggle', { ns: 'mainApp' })}</span> 
                        <input type="checkbox" class="daisy-toggle daisy-toggle-primary" 
                            bind:checked={$chatLogStyleState.hideChatUsername}
                            on:change={handleUsernameToggle}
                        />
                    </label>
                </div>
            </div>
        </Dropdown>
    </div>


    {#if isPaginationEnabled}
    <div class="flex gap-2 items-center">
        <Tooltip text={$i18n.t('chatLogView.paginationButtons.first.tooltip', { ns: 'mainApp' })}>
            <IconButton type="primary" icon={faBackwardStep} on:click={fetchFirstPage} disabled={isFirstPage} />
        </Tooltip>
        {#if screenWidth >= 330}
            <IconButton type="primary" icon={faAngleLeft} text={$i18n.t('chatLogView.paginationButtons.previous.label', { ns: 'mainApp' })} textPosition="right" on:click={fetchPrevPage} disabled={isFirstPage} />
            <IconButton type="primary" icon={faAngleRight} text={$i18n.t('chatLogView.paginationButtons.next.label', { ns: 'mainApp' })} textPosition="left" on:click={fetchNextPage} disabled={isLastPage} />
        {:else}
            <Tooltip text={$i18n.t('chatLogView.paginationButtons.previous.tooltip', { ns: 'mainApp' })}>
                <IconButton type="primary" icon={faAngleLeft} on:click={fetchPrevPage} disabled={isFirstPage} />
            </Tooltip>
            <Tooltip text={$i18n.t('chatLogView.paginationButtons.next.tooltip', { ns: 'mainApp' })}>
                <IconButton type="primary" icon={faAngleRight} on:click={fetchNextPage} disabled={isLastPage} />
            </Tooltip>
        {/if}

        {#if screenWidth >= 530}
            <Tooltip text={$i18n.t('chatLogView.pageSize.label', { ns: 'mainApp' })}>
                <select class="daisy-select ml-2"
                    bind:value={$requestConfig.pageSize} 
                    on:change={fetchFirstPage}
                >
                    {#each PAGE_SIZES as size}
                        <option value={size}>{size.toLocaleString('en-US')}{$i18n.t('chatLogView.pageSize.suffix', { ns: 'mainApp' })}</option>
                    {/each}
                </select>
            </Tooltip>
        {/if}
    </div>
    {/if}
</div>
