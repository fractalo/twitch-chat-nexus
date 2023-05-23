import { getChatClient } from "./ChatClient";
import { getGqlClient } from "./GqlClient";

export const clientGetters = {
    getChatClient,
    getGqlClient
};


export type ClientGetters = typeof clientGetters;