import { graphWorkspaceState } from "./state.js";
/** graph selection: shared behavior independent of action controllers. */
export function graphFindEntity(kind, ref) {
    if (kind === "edge") {
        return (graphWorkspaceState.filtered.edges || []).find((item) => String(item?.edge_id || "") === String(ref || "")) || null;
    }
    return (graphWorkspaceState.filtered.nodes || []).find((item) => String(item?.node_id || "") === String(ref || "")) || null;
}
