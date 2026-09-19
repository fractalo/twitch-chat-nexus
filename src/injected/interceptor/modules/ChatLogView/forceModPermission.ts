import { assignPropertyIfValid } from "src/util/assignPropertyIfValid";
import { getGqlClient } from "../../clients/GqlClient";
import messaging from "../../messaging";
import { debugLog, debugWarn } from '../../../debug';
import { isRecord } from 'src/util/typePredicates';

const chatLogPermissions = new Set([
    'moderation.user_chat_history:view',
    'moderation.vmcl.viewer_card.mod_logs:view',
    'moderation.vmcl.user_account_age:view',
]);

const modifyPermission: typeof assignPropertyIfValid = (target, property, value) => {
    const before = target && typeof target === 'object' ? (target as Record<string, unknown>)[property] : undefined;
    const modified = assignPropertyIfValid(target, property, value);
    debugLog('ChatLogView/permissions', 'Permission field modification', {
        property, targetPresent: !!target, before: typeof before === 'boolean' ? before : typeof before,
        after: modified ? value : undefined, modified,
    });
    return modified;
};

export const forceModPermission = () => {
    const gqlClient = getGqlClient();
    
    let isBroadcaster = false;
    let isModerator = false;

    const hasRealModPermission = () => isBroadcaster || isModerator;

    const messageType = 'IS_MODERATOR';

    const postMessage = () => {
        debugLog('ChatLogView/permissions', 'Sending IS_MODERATOR', { isBroadcaster, isModerator, hasRealModPermission: hasRealModPermission() });
        messaging.postMessage({ type: messageType, content: hasRealModPermission() })
    };

    messaging.on('message', (message) => {
        if (message.type === messageType) {
            debugLog('ChatLogView/permissions', 'Received permission state request');
            postMessage();
        }
    });

    gqlClient.setResponseHook('ViewerCard', async(request, response) => {
        isBroadcaster = response?.data?.channelUser?.id === response?.data?.currentUser?.id;
        postMessage();

        if (!modifyPermission(response?.data?.channelUser?.self, 'isModerator', true)) {
            debugWarn('ChatLogView/permissions', 'Could not modify ViewerCard response');
        }
        // The initial ViewerCard response can have channel: null. The subsequent
        // response includes the mod-log access flag used by the viewer card UI.
        const moderationSettings = response?.data?.channel?.moderationSettings;
        if (moderationSettings) {
            if (!modifyPermission(moderationSettings, 'canAccessViewerCardModLogs', true)) {
                debugWarn('ChatLogView/permissions', 'Could not modify ViewerCard mod-log access');
            }
        } else {
            debugLog('ChatLogView/permissions', 'ViewerCard has no moderationSettings; skipping mod-log access modification');
        }
        return response;
    });

    gqlClient.setResponseHook('ChannelPermissionSet', async(request, response) => {
        const results: unknown = response?.data?.channel?.permissionResults;
        if (!Array.isArray(results)) {
            debugWarn('ChatLogView/permissions', 'ChannelPermissionSet has no permissionResults array');
            return response;
        }

        for (const result of results) {
            if (!isRecord(result) || typeof result.permission !== 'string' || !chatLogPermissions.has(result.permission)) continue;
            const before = result.hasPermission;
            const modified = modifyPermission(result, 'hasPermission', true);
            debugLog('ChatLogView/permissions', 'ChannelPermissionSet chat-log permission', {
                permission: result.permission, before, after: result.hasPermission, modified,
            });
        }
        return response;
    });

    gqlClient.setResponseHook('ViewerCardModLogsPermissions', async(request, response) => {
        if (
            !modifyPermission(response?.data?.channel?.moderationSettings, 'canAccessViewerCardModLogs', true) ||
            !modifyPermission(response?.data?.channelUser?.self, 'isModerator', true)
        ) {
            debugWarn('ChatLogView/permissions', 'Could not modify ViewerCardModLogsPermissions response');
        }
        return response;
    });

    gqlClient.setResponseHook('UserModStatus', async(request, response) => {
        isModerator = (response?.data?.user?.isModerator as unknown) === true;
        postMessage();

        if (!modifyPermission(response?.data?.user, 'isModerator', true)) {
            debugWarn('ChatLogView/permissions', 'Could not modify UserModStatus response');
        }
        return response;
    });

    gqlClient.setResponseHook('CurrentUserModeratorStatus', async(request, response) => {
        isModerator = (response?.data?.user?.self?.isModerator as unknown) === true;
        postMessage();

        if (!modifyPermission(response?.data?.user?.self, 'isModerator', true)) {
            debugWarn('ChatLogView/permissions', 'Could not modify CurrentUserModeratorStatus response');
        }
        return response;
    });
};
