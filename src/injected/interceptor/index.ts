import './modules/ChatIndicator';
import './modules/ChatLogView';

import messaging from './messaging';
import { clientGetters } from './clients';

window.__TCN_preloaded ??= {};
window.__TCN_preloaded.clients = Object.freeze(clientGetters);

messaging.postMessage({ type: "LOADED" });