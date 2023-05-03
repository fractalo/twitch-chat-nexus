import { assignPropertyIfValid } from "src/util/assignPropertyIfValid";
import { getGqlClient } from "../../clients/GqlClient";

export const forceModPermission = () => {
    const gqlClient = getGqlClient();
    let isBroadcaster = false;
    let isModerator = false;

    gqlClient.setResponseHook('ViewerCard', async(request, response) => {
        isBroadcaster = response?.data?.channelUser?.id === response?.data?.currentUser?.id;
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
        if (!assignPropertyIfValid(response?.data?.user, 'isModerator', true)) {
            console.log('could not modify UserModStatus response.');
        }
        return response;
    });

    return () => isBroadcaster || isModerator;
};
