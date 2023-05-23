import './modules/ChatIndicator';
import './modules/ChatLogView';

import messaging from './messaging';
import { clientGetters } from './clients';


window.__TCH_preloaded ??= {};
window.__TCH_preloaded.clients = Object.freeze(clientGetters);

messaging.postMessage({ type: "LOADED" });