import { assignPropertyIfValid } from "src/util/assignPropertyIfValid";
import { getGqlClient } from "../../clients/GqlClient";
import messaging from "../../messaging";

export const forceModPermission = () => {
    const gqlClient = getGqlClient();
    
    let isBroadcaster = false;
    let isModerator = false;

    const hasRealModPermission = () => isBroadcaster || isModerator;

    const messageType = 'IS_MODERATOR';

    const postMessage = () => {
        messaging.postMessage({ type: messageType, content: hasRealModPermission() })
    };

    messaging.on('message', (message) => {
        if (message.type === messageType) {
            postMessage();
        }
    });

    gqlClient.setResponseHook('ViewerCard', async(request, response) => {
        isBroadcaster = response?.data?.channelUser?.id === response?.data?.currentUser?.id;
        postMessage();

        if (!assignPropertyIfValid(response?.data?.channelUser?.self, 'isModerator', true)) {
            console.log('could not modify ViewerCard response.');
        }
        return response;
    });

    gqlClient.setResponseHook('ViewerCardModLogsPermissions', async(request, response) => {
        if (
            !assignPropertyIfValid(response?.data?.channel?.moderationSettings, 'canAccessViewerCardModLogs', true) ||
            !assignPropertyIfValid(response?.data?.channelUser?.self, 'isModerator', true)
        ) {
            console.log('could not modify ViewerCardModLogsPermissions response.');
        }
        return response;
    });

    gqlClient.setResponseHook('UserModStatus', async(request, response) => {
        isModerator = (response?.data?.user?.isModerator as unknown) === true;
        postMessage();

        if (!assignPropertyIfValid(response?.data?.user, 'isModerator', true)) {
            console.log('could not modify UserModStatus response.');
        }
        return response;
    });

    gqlClient.setResponseHook('CurrentUserModeratorStatus', async(request, response) => {
        isModerator = (response?.data?.user?.self?.isModerator as unknown) === true;
        postMessage();

        if (!assignPropertyIfValid(response?.data?.user?.self, 'isModerator', true)) {
            console.log('could not modify CurrentUserModeratorStatus response.');
        }
        return response;
    });
};
