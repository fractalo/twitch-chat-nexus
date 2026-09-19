# <img src="src/assets/icons/icon128.png" height="40" style=""> Twitch Chat Nexus

A browser extension that provides features to enhance Twitch chat experience.

## Features
- View your chat history
- Adds an area to the chat window where you can collect chats of interest
- Indicates in color in the chat text box whether your chat has been sent successfully

## Build
```
npm install
npm run postinstall
npm run build
```

## Debugging
GQL and chat history diagnostics are disabled by default. To enable them, run this
in the Twitch page console, then reload the page:

```js
localStorage.setItem('TCN_DEBUG', 'true');
```

Filter the console by `[TCN]`. To disable diagnostics again:

```js
localStorage.removeItem('TCN_DEBUG');
```

This setting is stored for the current Twitch origin and browser profile. No
separate development build is required.

## Install
[![Available in the Chrome Web Store](https://github-production-user-asset-6210df.s3.amazonaws.com/42487844/237139321-1569748d-9179-4bc8-93d0-332f7d3f8eb6.png)](https://chrome.google.com/webstore/detail/twitch-chat-nexus/oopcjaklhenijofoanbpchndknfadldn)

[![get-the-addon](https://github-production-user-asset-6210df.s3.amazonaws.com/42487844/293645728-1792c780-9716-43d2-b416-bc2ab02678ba.png)](https://addons.mozilla.org/firefox/addon/twitch-chat-nexus/)

## Documentation
https://twitch-chat-nexus.gitbook.io/docs/
