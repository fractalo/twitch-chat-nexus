// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966#main-world-scripts

import { Messaging } from "src/components/Messaging";
import { scriptIds } from "src/constants/scripts";
import tailwindCss from './styles.css?inline';
import { injectInlineStyle } from "src/util/injectors";

injectInlineStyle(tailwindCss);

const SELF_ID = scriptIds.contentScript;

const messaging = new Messaging(SELF_ID);

messaging.on('connect', (id) => {
    console.log(`[${SELF_ID}] connected with ${id}`);
});

messaging.on('message', (message) => {
    console.log(`[${SELF_ID}] received message:`, message);
});


