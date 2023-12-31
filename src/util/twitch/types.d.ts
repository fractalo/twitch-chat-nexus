import type { Fiber } from "react-reconciler";

export interface ChatMessageInternal {
    fiber: Fiber;
    message: Record<string, unknown>;
}

export interface ChatMessageProps {
    message: ChatMessageInternal;
    [x: PropertyKey]: unknown;
}