import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import type { ComponentProps, ComponentType, SvelteComponent} from 'svelte';


export interface Page {
    component: ComponentType<SvelteComponent>;
    props?: ComponentProps<SvelteComponent>;
    useRootSimplebar: boolean;
}

export interface MenuItem {
    id: string;
    icon: IconDefinition;
    submenuIds?: string[]; 
    isExpanded?: boolean;
    isNew?: boolean;
}

export interface DaisyUiModalElement extends HTMLElement {
    showModal: () => void;
    close: () => void;
}

export type AlertLevel = 'normal' | 'info' | 'success' | 'warning' | 'error';

export interface Alert {
    message: string;
    level: AlertLevel;
}