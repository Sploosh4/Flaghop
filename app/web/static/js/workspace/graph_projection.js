/** Workspace graph projection. */
import { graphFriendlyLabel, graphHashToken, graphHostnameSuffix, graphPropertyValue, graphSubnetForIp, graphUrlHost } from "./graph_common.js";
import { graphGroupKeyForNode, graphNaturalCompare } from "./graph_layout.js";
import { GRAPH_LARGE_EDGE_THRESHOLD, GRAPH_LARGE_NODE_THRESHOLD, GRAPH_MATRIX_EDGE_THRESHOLD, GRAPH_MATRIX_GROUP_LIMIT, GRAPH_MATRIX_NODE_THRESHOLD, GRAPH_SEVERITY_ORDER, graphWorkspaceState } from "./state.js";

export function graphEntityUnderlyingNodeIds(entity) {
    if (!entity || typeof entity !== "object") {
        return [];
    }
    const memberNodeIds = Array.isArray(graphPropertyValue(entity, "member_node_ids"))
        ? graphPropertyValue(entity, "member_node_ids")
        : [];
    if (memberNodeIds.length) {
        return memberNodeIds.map((item) => String(item || "")).filter(Boolean);
    }
    const nodeId = String(entity.node_id || "");
    return nodeId ? [nodeId] : [];
}


export function graphShouldUseSummaryMode(nodeCount, edgeCount, renderMode) {
    const mode = String(renderMode || graphWorkspaceState.renderMode || "auto").trim().toLowerCase();
    if (mode === "graph") {
        return false;
    }
    if (mode === "summary") {
        return true;
    }
    if (mode === "matrix") {
        return true;
    }
    return nodeCount >= GRAPH_LARGE_NODE_THRESHOLD || edgeCount >= GRAPH_LARGE_EDGE_THRESHOLD;
}


export function graphShouldUseMatrixMode(nodeCount, edgeCount, renderMode) {
    const mode = String(renderMode || graphWorkspaceState.renderMode || "auto").trim().toLowerCase();
    if (mode === "matrix") {
        return true;
    }
    if (mode === "graph" || mode === "summary") {
        return false;
    }
    return nodeCount >= GRAPH_MATRIX_NODE_THRESHOLD || edgeCount >= GRAPH_MATRIX_EDGE_THRESHOLD;
}


export function graphDominantSourceKind(items) {
    const scores = new Map();
    const priority = {
        observed: 4,
        user_entered: 3,
        inferred: 2,
        ai_suggested: 1,
    };
    (items || []).forEach((item) => {
        const key = String(item?.source_kind || "observed").trim().toLowerCase() || "observed";
        const base = Number(scores.get(key) || 0);
        scores.set(key, base + 10 + Number(priority[key] || 0));
    });
    return Array.from(scores.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || "observed";
}


export function graphRepresentativeSeverity(items) {
    let best = "";
    let bestRank = Number.POSITIVE_INFINITY;
    (items || []).forEach((item) => {
        const severity = String(graphPropertyValue(item, "severity") || "").trim().toLowerCase();
        if (!severity) {
            return;
        }
        const rank = Object.prototype.hasOwnProperty.call(GRAPH_SEVERITY_ORDER, severity)
            ? GRAPH_SEVERITY_ORDER[severity]
            : 80;
        if (rank < bestRank) {
            bestRank = rank;
            best = severity;
        }
    });
    return best;
}


export function graphLargeClusterCollapseThreshold(nodeType, totalNodes) {
    const type = String(nodeType || "").trim().toLowerCase();
    if (type === "scope" || type === "subnet") {
        return Number.POSITIVE_INFINITY;
    }
    if (type === "finding" || type === "cve" || type === "exploit_reference") {
        return totalNodes >= 5000 ? 5 : 7;
    }
    if (type === "host" || type === "fqdn") {
        return totalNodes >= 5000 ? 3 : 5;
    }
    if (type === "service" || type === "port" || type === "url" || type === "screenshot") {
        return totalNodes >= 5000 ? 2 : 4;
    }
    if (type === "technology" || type === "cpe") {
        return totalNodes >= 5000 ? 2 : 3;
    }
    return totalNodes >= 5000 ? 2 : 4;
}


export function graphLargeClusterDescriptor(node, hostMaps) {
    const type = String(node?.type || "").trim().toLowerCase();
    const label = String(node?.label || "").trim();
    const hostId = parseInt(graphPropertyValue(node, "host_id"), 10);
    const hostname = String(graphPropertyValue(node, "hostname") || "").trim();
    const ip = String(graphPropertyValue(node, "ip") || "").trim();
    const serviceName = String(graphPropertyValue(node, "service") || graphPropertyValue(node, "name") || label || "").trim().toLowerCase();
    const urlHost = graphUrlHost(label).toLowerCase();
    if (type === "host") {
        return {
            type,
            bucket: graphSubnetForIp(ip) || hostMaps.subnetByHostId.get(hostId) || graphHostnameSuffix(hostname) || "hosts",
        };
    }
    if (type === "fqdn") {
        return {
            type,
            bucket: graphHostnameSuffix(label || hostname) || hostMaps.domainByHostId.get(hostId) || "domains",
        };
    }
    if (type === "port") {
        return {
            type,
            bucket: `${graphPropertyValue(node, "port") || label}/${graphPropertyValue(node, "protocol") || "tcp"}`.replace(/\/$/, ""),
        };
    }
    if (type === "service") {
        return {
            type,
            bucket: serviceName || "service",
        };
    }
    if (type === "url") {
        return {
            type,
            bucket: urlHost || graphHostnameSuffix(hostname) || "urls",
        };
    }
    if (type === "technology" || type === "cpe" || type === "credential" || type === "identity" || type === "session") {
        return {
            type,
            bucket: String(label || graphPropertyValue(node, "name") || type).trim().toLowerCase() || type,
        };
    }
    if (type === "screenshot" || type === "artifact" || type === "action" || type === "evidence_record") {
        return {
            type,
            bucket: hostname || hostMaps.hostLabelById.get(hostId) || graphSubnetForIp(ip) || type,
        };
    }
    if (type === "finding" || type === "cve" || type === "exploit_reference") {
        return {
            type,
            bucket: String(label || graphPropertyValue(node, "title") || graphPropertyValue(node, "cve") || graphPropertyValue(node, "severity") || type)
                .trim()
                .toLowerCase() || type,
        };
    }
    return {
        type,
        bucket: String(label || type).trim().toLowerCase() || type,
    };
}


export function graphLargeClusterLabel(type, bucket, memberNodes) {
    const count = Array.isArray(memberNodes) ? memberNodes.length : 0;
    const cleanedBucket = graphFriendlyLabel(String(bucket || "").replace(/^.+?:/, "")) || graphFriendlyLabel(type) || "summary";
    const plural = count === 1 ? "" : "s";
    if (type === "host") {
        return `${cleanedBucket} ${count} host${plural}`;
    }
    if (type === "fqdn") {
        return `${cleanedBucket} ${count} fqdn${plural}`;
    }
    if (type === "service" || type === "port" || type === "technology" || type === "cpe") {
        return `${cleanedBucket} ${count}`;
    }
    if (type === "url") {
        return `${cleanedBucket} ${count} url${plural}`;
    }
    if (type === "screenshot") {
        return `${cleanedBucket} ${count} screenshot${plural}`;
    }
    return `${cleanedBucket} ${count}`;
}


export function graphCreateSummaryNode(summaryId, groupKey, descriptor, memberNodes) {
    const severity = graphRepresentativeSeverity(memberNodes);
    const sampleLabels = (memberNodes || []).map((item) => String(item?.label || "").trim()).filter(Boolean).slice(0, 3);
    return {
        node_id: summaryId,
        type: descriptor.type,
        label: graphLargeClusterLabel(descriptor.type, descriptor.bucket, memberNodes),
        confidence: Math.max(...(memberNodes || []).map((item) => Number(item?.confidence || 0) || 0), 0),
        source_kind: graphDominantSourceKind(memberNodes),
        properties: {
            summary_kind: true,
            summary_group_key: groupKey,
            member_count: memberNodes.length,
            member_node_ids: memberNodes.map((item) => String(item?.node_id || "")).filter(Boolean),
            member_types: Array.from(new Set(memberNodes.map((item) => String(item?.type || "").trim().toLowerCase()).filter(Boolean))),
            sample_labels: sampleLabels,
            collapsed_type: descriptor.type,
            severity,
        },
        evidence_refs: [],
    };
}


export function graphLimitAggregateEdges(edges, summaryNodeIds, selectedVisibleId, focusActive) {
    const sorted = (edges || []).slice().sort((left, right) => {
        const leftCount = Number(graphPropertyValue(left, "aggregate_count") || 1);
        const rightCount = Number(graphPropertyValue(right, "aggregate_count") || 1);
        if (leftCount !== rightCount) {
            return rightCount - leftCount;
        }
        return graphNaturalCompare(left?.edge_id || "", right?.edge_id || "");
    });
    if (focusActive) {
        return sorted;
    }
    const perNode = new Map();
    const kept = [];
    sorted.forEach((edge) => {
        const fromId = String(edge?.from_node_id || "");
        const toId = String(edge?.to_node_id || "");
        const count = Number(graphPropertyValue(edge, "aggregate_count") || 1);
        const fromSummary = summaryNodeIds.has(fromId);
        const toSummary = summaryNodeIds.has(toId);
        if (selectedVisibleId && (fromId === selectedVisibleId || toId === selectedVisibleId)) {
            kept.push(edge);
            return;
        }
        if (fromSummary || toSummary || count >= 3) {
            kept.push(edge);
            return;
        }
        const fromSeen = Number(perNode.get(fromId) || 0);
        const toSeen = Number(perNode.get(toId) || 0);
        if (fromSeen >= 6 && toSeen >= 6) {
            return;
        }
        perNode.set(fromId, fromSeen + 1);
        perNode.set(toId, toSeen + 1);
        kept.push(edge);
    });
    return kept;
}


export function graphBuildLargeGraphProjection(nodes, edges, hostMaps, groupBy) {
    const totalNodes = Array.isArray(nodes) ? nodes.length : 0;
    const groupsMap = new Map();
    (nodes || []).forEach((node) => {
        const groupKey = graphGroupKeyForNode(node, groupBy, hostMaps) || "other";
        if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, []);
        }
        groupsMap.get(groupKey).push(node);
    });

    const visibleNodes = [];
    const visibleNodeIdsByGroup = new Map();
    const memberToVisible = new Map();
    const summaryNodeIds = new Set();
    const visibleNodeMap = new Map();

    groupsMap.forEach((groupNodes, groupKey) => {
        const clusters = new Map();
        (groupNodes || []).forEach((node) => {
            const descriptor = graphLargeClusterDescriptor(node, hostMaps);
            const clusterKey = `${descriptor.type}|${descriptor.bucket}`;
            if (!clusters.has(clusterKey)) {
                clusters.set(clusterKey, {
                    descriptor,
                    nodes: [],
                });
            }
            clusters.get(clusterKey).nodes.push(node);
        });
        visibleNodeIdsByGroup.set(groupKey, new Set());
        clusters.forEach((cluster, clusterKey) => {
            const type = String(cluster.descriptor?.type || "").trim().toLowerCase();
            const threshold = graphLargeClusterCollapseThreshold(type, totalNodes);
            const summaryId = `graph-summary-${graphHashToken(`${groupKey}|${clusterKey}`)}`;
            const expanded = Boolean(graphWorkspaceState.expandedSummaryIds[summaryId]);
            const shouldCollapse = cluster.nodes.length > threshold && !expanded;
            if (shouldCollapse) {
                const summaryNode = graphCreateSummaryNode(summaryId, groupKey, cluster.descriptor, cluster.nodes);
                visibleNodes.push(summaryNode);
                visibleNodeMap.set(summaryId, summaryNode);
                visibleNodeIdsByGroup.get(groupKey).add(summaryId);
                summaryNodeIds.add(summaryId);
                cluster.nodes.forEach((node) => {
                    memberToVisible.set(String(node?.node_id || ""), summaryId);
                });
                return;
            }
            cluster.nodes.forEach((node) => {
                const nodeId = String(node?.node_id || "");
                visibleNodes.push(node);
                visibleNodeMap.set(nodeId, node);
                visibleNodeIdsByGroup.get(groupKey).add(nodeId);
                memberToVisible.set(nodeId, nodeId);
            });
        });
    });

    const edgeMap = new Map();
    (edges || []).forEach((edge) => {
        const fromVisibleId = memberToVisible.get(String(edge?.from_node_id || ""));
        const toVisibleId = memberToVisible.get(String(edge?.to_node_id || ""));
        if (!fromVisibleId || !toVisibleId || fromVisibleId === toVisibleId) {
            return;
        }
        const edgeType = String(edge?.type || "").trim().toLowerCase() || "related";
        const key = `${fromVisibleId}|${toVisibleId}|${edgeType}`;
        if (!edgeMap.has(key)) {
            edgeMap.set(key, {
                edge_id: `graph-edge-summary-${graphHashToken(key)}`,
                type: edgeType,
                from_node_id: fromVisibleId,
                to_node_id: toVisibleId,
                source_kind: "observed",
                confidence: 0,
                members: [],
                properties: {
                    aggregate_kind: true,
                    aggregate_count: 0,
                    edge_types: [],
                },
            });
        }
        const record = edgeMap.get(key);
        record.members.push(edge);
        record.properties.aggregate_count += Number(graphPropertyValue(edge, "aggregate_count") || 1);
        record.properties.edge_types.push(edgeType);
        record.confidence = Math.max(Number(record.confidence || 0), Number(edge?.confidence || 0) || 0);
        record.source_kind = graphDominantSourceKind(record.members);
    });

    const selectedVisibleId = String(graphWorkspaceState.selectedRef || "");
    const focusActive = Array.isArray(graphWorkspaceState.focusSeedNodeIds) && graphWorkspaceState.focusSeedNodeIds.length > 0;
    const projectedEdges = graphLimitAggregateEdges(
        Array.from(edgeMap.values()).map((edge) => ({
            edge_id: edge.edge_id,
            type: edge.type,
            from_node_id: edge.from_node_id,
            to_node_id: edge.to_node_id,
            source_kind: edge.source_kind,
            confidence: edge.confidence,
            properties: {
                ...edge.properties,
                edge_types: Array.from(new Set(edge.properties.edge_types)),
            },
        })),
        summaryNodeIds,
        selectedVisibleId,
        focusActive,
    );

    const projectedGroups = new Map();
    visibleNodeIdsByGroup.forEach((nodeIdSet, groupKey) => {
        const visibleGroupNodes = Array.from(nodeIdSet)
            .map((nodeId) => visibleNodeMap.get(String(nodeId || "")))
            .filter(Boolean);
        if (visibleGroupNodes.length) {
            projectedGroups.set(groupKey, visibleGroupNodes);
        }
    });

    return {
        nodes: visibleNodes,
        edges: projectedEdges,
        groupsMap: projectedGroups,
        usedSummary: summaryNodeIds.size > 0,
        summaryNodeIds,
    };
}


export function graphComputeFocusedSubgraph(nodes, edges, seedNodeIds, depth) {
    const requestedSeeds = Array.isArray(seedNodeIds) ? seedNodeIds.map((item) => String(item || "")).filter(Boolean) : [];
    if (!requestedSeeds.length) {
        return {
            nodes,
            edges,
            active: false,
        };
    }
    const nodeById = new Map((nodes || []).map((node) => [String(node?.node_id || ""), node]));
    const seeds = requestedSeeds.filter((nodeId) => nodeById.has(nodeId));
    if (!seeds.length) {
        return {
            nodes,
            edges,
            active: false,
        };
    }
    const neighborMap = new Map();
    (edges || []).forEach((edge) => {
        const fromId = String(edge?.from_node_id || "");
        const toId = String(edge?.to_node_id || "");
        if (!fromId || !toId) {
            return;
        }
        if (!neighborMap.has(fromId)) {
            neighborMap.set(fromId, new Set());
        }
        if (!neighborMap.has(toId)) {
            neighborMap.set(toId, new Set());
        }
        neighborMap.get(fromId).add(toId);
        neighborMap.get(toId).add(fromId);
    });

    const visited = new Set(seeds);
    let frontier = seeds.slice();
    const maxDepth = Math.max(1, Math.min(3, Number(depth || 1)));
    for (let step = 0; step < maxDepth; step += 1) {
        const next = [];
        frontier.forEach((nodeId) => {
            const neighbors = Array.from(neighborMap.get(nodeId) || []);
            neighbors.forEach((neighborId) => {
                if (visited.has(neighborId)) {
                    return;
                }
                visited.add(neighborId);
                next.push(neighborId);
            });
        });
        frontier = next;
        if (!frontier.length) {
            break;
        }
    }
    return {
        nodes: (nodes || []).filter((node) => visited.has(String(node?.node_id || ""))),
        edges: (edges || []).filter((edge) => visited.has(String(edge?.from_node_id || "")) && visited.has(String(edge?.to_node_id || ""))),
        active: true,
    };
}


export function graphComputeMatrixView(nodes, edges, groups) {
    const nodeToGroup = new Map();
    (groups || []).forEach((group) => {
        (group.nodeIds || []).forEach((nodeId) => {
            nodeToGroup.set(String(nodeId || ""), String(group.key || ""));
        });
    });

    const activity = new Map();
    (edges || []).forEach((edge) => {
        const fromKey = nodeToGroup.get(String(edge?.from_node_id || ""));
        const toKey = nodeToGroup.get(String(edge?.to_node_id || ""));
        if (!fromKey || !toKey) {
            return;
        }
        const count = Number(graphPropertyValue(edge, "aggregate_count") || 1);
        activity.set(fromKey, Number(activity.get(fromKey) || 0) + count);
        activity.set(toKey, Number(activity.get(toKey) || 0) + count);
    });

    const orderedGroups = (groups || []).map((group) => ({
        key: String(group?.key || ""),
        label: String(group?.label || group?.key || ""),
        nodeCount: Array.isArray(group?.nodeIds) ? group.nodeIds.length : 0,
        activity: Number(activity.get(String(group?.key || "")) || 0),
    })).sort((left, right) => {
        if (left.activity !== right.activity) {
            return right.activity - left.activity;
        }
        if (left.nodeCount !== right.nodeCount) {
            return right.nodeCount - left.nodeCount;
        }
        return graphNaturalCompare(left.label, right.label);
    });

    const keptGroups = orderedGroups.slice(0, GRAPH_MATRIX_GROUP_LIMIT);
    const keptKeys = new Set(keptGroups.map((group) => group.key));
    const otherNeeded = orderedGroups.length > keptGroups.length;
    const indexByKey = new Map(keptGroups.map((group, index) => [group.key, index]));
    if (otherNeeded) {
        keptGroups.push({
            key: "__other__",
            label: "other",
            nodeCount: orderedGroups.slice(GRAPH_MATRIX_GROUP_LIMIT).reduce((sum, group) => sum + group.nodeCount, 0),
            activity: orderedGroups.slice(GRAPH_MATRIX_GROUP_LIMIT).reduce((sum, group) => sum + group.activity, 0),
        });
    }

    const size = keptGroups.length;
    const values = Array.from({length: size}, () => Array.from({length: size}, () => 0));
    let maxValue = 0;
    (edges || []).forEach((edge) => {
        let fromKey = nodeToGroup.get(String(edge?.from_node_id || ""));
        let toKey = nodeToGroup.get(String(edge?.to_node_id || ""));
        if (!fromKey || !toKey) {
            return;
        }
        if (!keptKeys.has(fromKey)) {
            fromKey = "__other__";
        }
        if (!keptKeys.has(toKey)) {
            toKey = "__other__";
        }
        const rowIndex = keptGroups.findIndex((group) => group.key === fromKey);
        const columnIndex = keptGroups.findIndex((group) => group.key === toKey);
        if (rowIndex < 0 || columnIndex < 0) {
            return;
        }
        const count = Number(graphPropertyValue(edge, "aggregate_count") || 1);
        values[rowIndex][columnIndex] += count;
        maxValue = Math.max(maxValue, values[rowIndex][columnIndex]);
    });

    return {
        groups: keptGroups,
        values,
        maxValue,
    };
}
