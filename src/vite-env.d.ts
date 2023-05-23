/// <reference types="svelte" />
/// <reference types="vite/client" />


// https://vitejs.dev/guide/api-hmr.html
interface ViteHotContext {
    readonly data: any
  
    // accept(): void
    accept(cb?: (mod: ModuleNamespace | undefined) => void): void
    accept(dep: string, cb: (mod: ModuleNamespace | undefined) => void): void
    accept(deps: readonly string[], cb: (mods: Array<ModuleNamespace | undefined>) => void): void
  
    dispose(cb: (data: any) => void): void
    decline(): void
    invalidate(): void
  
    // `InferCustomEventPayload` provides types for built-in Vite events
    on<T extends string>(event: T, cb: (payload: InferCustomEventPayload<T>) => void): void
    send<T extends string>(event: T, data?: InferCustomEventPayload<T>): void
}
  
// Allow for virtual module imports
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
declare module 'virtual:*' 


declare module '*?script&module' {
    /**
     * Script format is ESM. No loader and no HMR. Does not support frameworks
     * that use HMR. Import into a content script to inject via script tag into
     * the host page main world execution environment.
     *
     * Exports the file name of the output script file.
     *
     * If imported inside a content script, RPCE will include the file name in
     * `web_accessible_resources`.
     */
    const fileName: string
    export default fileName
}
