// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966
import styles from "./styles.css?inline";
import injectedMain from "src/injected/main?script&module";
import { injectInlineStyle, injectScript } from "src/util/injectors";
import { isInAllowedFrame } from "src/util/isInAllowedFrame";

(async() => {
    if (!isInAllowedFrame()) {
        return;
    }

    injectInlineStyle(styles);
    injectScript(chrome.runtime.getURL(injectedMain), 'module');

    import("./messaging");
    import("./storage");

})();
