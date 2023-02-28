import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from "path";
import manifest from "./manifest.json";

const srcDir = resolve(__dirname, "src");

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte(), crx({ manifest })],
    resolve: {
        alias: {
            src: srcDir,
        },
    },
})
