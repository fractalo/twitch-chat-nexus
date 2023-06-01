import { sha256 } from 'crypto-hash';
import query from './query.gql?raw';
import type { GqlRequest } from '../../types';
import { isRecord } from 'src/util/SafeAny';

const queryHash = sha256(query);

interface Variables extends Record<string, unknown> {
    channelID: string;
    senderID: string;
    first: number;
    cursor: string | null;
}

export interface ModLogsMessagesGqlRequest extends GqlRequest {
    variables: Variables;
}

export const createModLogsMessagesRequest = async(variables: Variables): Promise<ModLogsMessagesGqlRequest> => {
    return {
        operationName: `TCH_ViewerCardModLogsMessagesBySenderV2`,
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

const getZumaFromCursor = (cursor: string) => {
    try {
        const parsedCursor = JSON.parse(window.atob(cursor)) as unknown;
        if (isRecord(parsedCursor) && typeof parsedCursor?.zuma === 'string') {
            return parsedCursor.zuma;
        }
    } catch {}
};

export const filterEdges = (edges: unknown[], variables: Variables): Edge[] => {
    const cursorZuma = variables.cursor ? getZumaFromCursor(variables.cursor) : null;
    
    return edges.filter((edge): edge is Edge => {
        if (!isRecord(edge) || !edge.cursor || typeof edge.cursor !== 'string') return false;
        if (!cursorZuma) return true;
        
        const edgeZuma = getZumaFromCursor(edge.cursor);

        return !!edgeZuma && (edgeZuma < cursorZuma);
    });
};

