import { forceModPermission } from "./forceModPermission";
import { isSelfViewerCardPage } from "src/util/twitch";

(async() => {
    if (!isSelfViewerCardPage()) {
        return;
    }

    forceModPermission();

})();




