import { chatClient } from './ChatClient';


chatClient.on('send', (message) => {
    console.log(Date.now(), message.tags.get('client-nonce'));
});

chatClient.on('receive', (message) => {
    message.command === 'USERSTATE' && console.log(Date.now(), message.tags.get('client-nonce'));
});