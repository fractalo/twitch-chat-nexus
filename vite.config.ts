import { crx } from "@crxjs/vite-plugin";
import { defineConfig, UserConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import i18nextLoader from 'vite-plugin-i18next-loader';
import { resolve } from "path";
import manifest from "./manifest.json";

const srcDir = resolve(__dirname, "src");
const publicDir = resolve(__dirname, "public");

type Browser = Parameters<typeof crx>[0]['browser'];

const BROWSER_TYPES: string[] = [
    'chrome',
    'firefox',
] satisfies Browser[];

const createOutdirName = (browser: string) => `dist-${browser}`;

const OUTDIRS = BROWSER_TYPES.map(createOutdirName);

let browser: Browser = 'chrome';

if (process.env.BROWSER) {
    if (!BROWSER_TYPES.includes(process.env.BROWSER)){
        throw new Error('BROWSER_TYPES is not valid');
    }
    browser = process.env.BROWSER as Browser;
}

const outDir = createOutdirName(browser);

if (browser === 'firefox') {
    manifest['browser_specific_settings'] = {
        gecko: {
            id: 'twitch.chat.nexus@example.com'
        }
    };
}


// https://www.raulmelo.dev/blog/build-javascript-library-with-multiple-entry-points-using-vite-3
const userConfigs: Record<string, UserConfig> = {
    main: {
        plugins: [
            svelte(), 
            crx({ 
                manifest,
                browser,
             }),
             i18nextLoader({
                paths: [resolve(srcDir, "i18n/locales")],
                namespaceResolution: 'basename',
            }),
        ],
        build: {
            modulePreload: false,
            outDir
        },
        server: {
            port: 5173,
            strictPort: true,
            hmr: {
                clientPort: 5173,
            },
        },
    },
    interceptor: {
        build: {
            rollupOptions: {
                input: {
                    interceptor: resolve(srcDir, "injected/interceptor/index.ts")
                },
                output: [
                    'public', // prevent crxjs build error
                    ...OUTDIRS
                ].map(dir => ({
                    entryFileNames: '[name].js',
                    format: 'iife',
                    dir: `${dir}/scripts`,
                })), 
            },
            emptyOutDir: false,
            copyPublicDir: false,
        }
    },
    earlyInjector: {
        build: {
            rollupOptions: {
                input: {
                    earlyInjector: resolve(srcDir, "earlyInjector/index.ts")
                },
                output: OUTDIRS.map(dir => ({
                    entryFileNames: '[name].js',
                    format: 'iife',
                    dir,
                })),
            },
            emptyOutDir: false,
            copyPublicDir: false,
        }
    },
};

const currentConfig = userConfigs[process.env.BUILD_TYPE];

if (!currentConfig) {
    throw new Error('BUILD_TYPE is not defined or is not valid');
}

const commonConfig: UserConfig = {
    resolve: {
        alias: {
            src: srcDir,
            public: publicDir,
        },
    }
};

// https://vitejs.dev/config/
export default defineConfig({
    ...commonConfig,
    ...currentConfig
});
