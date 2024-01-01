import { injectScript } from "src/util/injectors";
import { isInAllowedFrame } from "src/util/isInAllowedFrame";


(() => {
    if (!isInAllowedFrame()) {
        return;
    }

    injectScript(chrome.runtime.getURL('scripts/interceptor.js'));

})();