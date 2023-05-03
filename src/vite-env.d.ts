/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.gql' {
    const plainText: string;
    export default plainText;
}
