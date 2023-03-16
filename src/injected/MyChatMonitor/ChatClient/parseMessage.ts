import { parseTwitchMessage } from "@twurple/chat";

export const parseMessage = (line: string) => {
    try {
        return parseTwitchMessage(line);
    } catch(error) {
        return null;
    }
};