import { fetchJson } from "./http.js";
/** tool api: shared behavior independent of action controllers. */
export async function fetchWorkspaceToolsPage({service = "", port = "", protocol = "tcp", limit = 500, offset = 0} = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (service) {
        params.set("service", String(service));
    }
    if (port) {
        params.set("port", String(port));
    }
    if (protocol) {
        params.set("protocol", String(protocol));
    }
    return fetchJson(`/api/workspace/tools?${params.toString()}`);
}



export async function fetchWorkspaceToolsAll({service = "", port = "", protocol = "tcp"} = {}) {
    const allTools = [];
    let offset = 0;
    let pageGuard = 0;
    const pageLimit = 500;

    while (pageGuard < 200) {
        const body = await fetchWorkspaceToolsPage({service, port, protocol, limit: pageLimit, offset});
        const tools = Array.isArray(body?.tools) ? body.tools : [];
        allTools.push(...tools);
        if (!body?.has_more) {
            break;
        }
        const nextOffset = Number(body.next_offset);
        if (!Number.isFinite(nextOffset) || nextOffset <= offset) {
            break;
        }
        offset = nextOffset;
        pageGuard += 1;
    }

    return allTools;
}
