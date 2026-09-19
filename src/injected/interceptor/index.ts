import './modules/ChatIndicator';
import './modules/ChatLogView';

import messaging from './messaging';
import { clientGetters } from './clients';
import { debugLog } from '../debug';

debugLog('Interceptor', 'Entry point executing');

window.__TCN_preloaded ??= {};
window.__TCN_preloaded.clients = Object.freeze(clientGetters);
debugLog('Interceptor', 'Client getters published; sending LOADED');

messaging.postMessage({ type: "LOADED" });
