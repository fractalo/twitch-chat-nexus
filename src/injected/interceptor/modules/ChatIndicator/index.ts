import { getChatClient } from '../../clients/ChatClient';

(async() => {
    const chatClient = getChatClient();

    if (chatClient.isOpened()) {
        chatClient.sendPing(true);
    } else {
        chatClient.on('open', () => {
            setTimeout(() => chatClient.sendPing(true), 5000);
        });
    }
    
})();

