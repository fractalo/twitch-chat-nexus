import { sha256 } from 'crypto-hash';
import query from './query.gql';
import type { GqlRequest } from '../../types';
import { isRecord } from 'src/util/SafeAny';

const queryHash = sha256(query);

type SortOrder = "ASC" | "DESC";

interface Variables extends Record<string, unknown> {
    channelLogin: string;
    senderID: string;
    first: number;
    order: SortOrder;
    cursor: string | null;
}

export interface ModLogsMessagesGqlRequest extends GqlRequest {
    variables: Variables;
}

export const createModLogsMessagesRequest = async(variables: Variables): Promise<ModLogsMessagesGqlRequest> => {
    return {
        operationName: `TCH_ViewerCardModLogsMessagesBySender`,
        extensions: {
            persistedQuery: {
                sha256Hash: (await queryHash),
                version: 1
            }
        },
        variables
    };  
};

export const modLogsMessagesQuery = query;


interface Edge {
    cursor: string;
}

export const filterEdges = (edges: unknown[], variables: Variables): Edge[] => {
    return edges.filter((edge): edge is Edge => {
        if (!isRecord(edge) || !edge.cursor || typeof edge.cursor !== 'string') return false;
        if (!variables.cursor) return true;

        if (variables.order === "ASC") {
            return edge.cursor > variables.cursor;
        } else {
            return edge.cursor < variables.cursor;
        }
    });
};

