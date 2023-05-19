import { crx } from "@crxjs/vite-plugin";
import { defineConfig, UserConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from "path";
import manifest from "./manifest.json";

const srcDir = resolve(__dirname, "src");

// https://www.raulmelo.dev/blog/build-javascript-library-with-multiple-entry-points-using-vite-3
const userConfigs: Record<string, UserConfig> = {
    main: {
        plugins: [
            svelte(), 
            crx({ manifest })
        ],
    },
    injectedScript: {
        plugins: [
            svelte({
                emitCss: false
        ],
        build: {
            rollupOptions: {
                input: {
                    injected: resolve(srcDir, "injected/index.ts")
                },
                output: {
                    entryFileNames: '[name].js',
                    format: 'iife',
                },
            },
            emptyOutDir: false,
        }
    }
}

const currentConfig = userConfigs[process.env.BUILD_TYPE];

if (!currentConfig) {
    throw new Error('BUILD_TYPE is not defined or is not valid');
}

const commonConfig: UserConfig = {
    resolve: {
        alias: {
            src: srcDir,
        },
    }
};

// https://vitejs.dev/config/
export default defineConfig({
    ...commonConfig,
    ...currentConfig
});
