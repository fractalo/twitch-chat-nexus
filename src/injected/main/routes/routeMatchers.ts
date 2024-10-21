import { pathToRegexp } from 'path-to-regexp';

interface RouteMatcher {
    name: string;
    regex: RegExp;
    matchState?: (state: any) => boolean;
}

// https://github.com/FrankerFaceZ/FrankerFaceZ/blob/master/src/sites/twitch-twilight/index.js
const TWITCH_ROUTES = {
    'front-page': '/',
	'collection': '/collections/:collectionID',
	'dir': '/directory',
	'dir-following': '/directory/following{/:category}',
	'dir-game-index': '/directory/category/:gameName',
	'dir-game-clips': '/directory/category/:gameName/clips',
	'dir-game-videos': '/directory/category/:gameName/videos/:filter',
	'dir-all': '/directory/all{/:filter}',
	'event': '/event/:eventName',
	'chat': '/popout/:loginName/chat',
	'video': '/videos/:videoID',
	'channel-video': '/:loginName/video/:videoID',
	'channel-videos': '/:loginName/videos{/:filter}',
	'channel-clips': '/:loginName/clips',
	'channel-clip': '/:loginName/clip/:clipID',
	'channel-collections': '/:loginName/collections',
	'channel-events': '/:loginName/events',
	'product': '/products/:productName',
	'turbo': '/turbo',
	'search': '/search',
	'squad': '/:loginName/squad',
	'command-center': '/:loginName/commandcenter',
	'embed-chat': '/embed/:loginName/chat',
	'mod-view': '/moderator/:loginName',
	'mod-popout-chat': '/popout/moderator/:loginName/chat'
};

const routeMatchers: RouteMatcher[] = Object.entries(TWITCH_ROUTES).map(([name, route]) => {
    return {
        name,
        regex: pathToRegexp(route).regexp
    };
});

routeMatchers.push(
    {
        name: 'channel',
        regex: pathToRegexp('/:loginName').regexp,
        matchState: state => state?.state?.channelView !== 'Home'
    }, 
    {
        name: 'channel-home',
        regex: pathToRegexp('/:loginName').regexp,
        matchState: state => state?.state?.channelView === 'Home'
    }
);

export default routeMatchers;