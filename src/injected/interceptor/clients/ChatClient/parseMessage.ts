import { parseTwitchMessage } from "@twurple/chat";
import type { Message } from "node_modules/ircv3/lib";

export const parseMessage = (line: string): Message | null => {
    try {
        return parseTwitchMessage(line);
    } catch(error) {
        return null;
    }
};