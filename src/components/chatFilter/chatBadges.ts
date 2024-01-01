export const BADGE_GROUPS: Readonly<Record<string, ReadonlyArray<string>>> = {
    channel: [
        'broadcaster',
        'moderator',
        'vip',
        'artist-badge',
        'subscriber',
        'founder',
        'bits',
        'bits-leader',
        'sub-gifter',
        'sub-gift-leader',
        'hype-train',
        'predictions',
    ],
    twitch: [
        'partner',
        'premium',
        'turbo',
        'ambassador',
        'game-developer',
        'admin',
        'staff',
        'global_mod',
        'twitchbot',
        'extension',
        'user-anniversary',
        'anonymous-cheerer',
    ],
    special: [
        'no_audio',
        'no_video',
    ],
};

export const GROUPPED_BADGES: ReadonlySet<string> = new Set(Object.values(BADGE_GROUPS).flat());

export const RANGE_SELECTABLE_BADGES: ReadonlySet<string> = new Set([
    'bits', 
    'sub-gifter',
    'moments',
]);

