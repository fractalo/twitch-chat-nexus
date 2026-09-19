import { forceModPermission } from "./forceModPermission";
import { getSelfLoginName, isSelfViewerCardPage } from "src/util/twitch";
import { debugLog } from '../../../debug';

(async() => {
    debugLog('ChatLogView/interceptor', 'Checking page eligibility', { hasLoginCookie: !!getSelfLoginName(), isSelfViewerCard: isSelfViewerCardPage() });
    if (!isSelfViewerCardPage()) {
        debugLog('ChatLogView/interceptor', 'Skipping permission hooks: not a self viewer card page');
        return;
    }

    forceModPermission();
    debugLog('ChatLogView/interceptor', 'Permission hooks registered');

})();




