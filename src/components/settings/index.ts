import type { ComponentProps } from "svelte";
import Settings from "./Settings.svelte";
import type { Page } from "src/components/types";

export const getSettingPage = (props: ComponentProps<Settings>): Page => {
    return {
        component: Settings,
        useRootSimplebar: true,
        props
    };
};