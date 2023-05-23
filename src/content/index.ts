// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966

import styles from './styles.css?inline';
import injectedMain from '../injected/main?script&module';
import { injectInlineStyle, injectScript } from "src/util/injectors";
import { type MainCategorySettingValues } from 'src/components/settings';
import messaging from './messaging';


injectInlineStyle(styles);

injectScript(injectedMain);



/** post updated setting values */
chrome.storage.local.onChanged.addListener((changes) => {
    const newSettingValues = changes.settings?.newValue as MainCategorySettingValues | undefined;
    if (!newSettingValues) return;

    messaging.postMessage({ type: "SETTINGS", content: newSettingValues });
});





