/** Workspace graph layout. */
import { graphFriendlyLabel, graphPropertyValue, graphSubnetForIp } from "./graph_common.js";
import { normalizeCategoryList } from "./host_filters.js";
import { GRAPH_NODE_SIZE, GRAPH_SEVERITY_ORDER, GRAPH_TYPE_ORDER, graphWorkspaceState } from "./state.js";

export function graphBuildHostMaps(nodes) {
    const hostById = new Map();
    const hostLabelById = new Map();
    const subnetByHostId = new Map();
    const domainByHostId = new Map();
    const categoriesByHostId = new Map();
    (nodes || []).forEach((node) => {
        const hostId = parseInt(graphPropertyValue(node, "host_id"), 10);
        if (!Number.isFinite(hostId) || hostId <= 0) {
            return;
        }
        if (String(node.type || "") === "host") {
            hostById.set(hostId, node);
            hostLabelById.set(hostId, String(node.label || graphPropertyValue(node, "ip") || `host-${hostId}`));
            const hostname = String(graphPropertyValue(node, "hostname") || "").trim();
            if (hostname) {
                domainByHostId.set(hostId, hostname);
            }
            const ip = String(graphPropertyValue(node, "ip") || "").trim();
            if (ip) {
                subnetByHostId.set(hostId, graphSubnetForIp(ip));
            }
            const categoryValue = graphPropertyValue(node, "device_categories");
            if (Array.isArray(categoryValue)) {
                categoriesByHostId.set(hostId, normalizeCategoryList(categoryValue));
            } else {
                categoriesByHostId.set(hostId, normalizeCategoryList(String(categoryValue || "").split(",")));
            }
        }
    });
    return {
        hostById,
        hostLabelById,
        subnetByHostId,
        domainByHostId,
        categoriesByHostId,
    };
}


export function graphGroupKeyForNode(node, groupBy, hostMaps) {
    const summaryGroupKey = String(graphPropertyValue(node, "summary_group_key") || "").trim();
    if (summaryGroupKey) {
        return summaryGroupKey;
    }
    const type = String(node?.type || "").trim().toLowerCase();
    const hostId = parseInt(graphPropertyValue(node, "host_id"), 10);
    const hostname = String(graphPropertyValue(node, "hostname") || "").trim();
    const serviceName = String(
        graphPropertyValue(node, "service")
        || graphPropertyValue(node, "name")
        || graphPropertyValue(node, "product")
        || ""
    ).trim();
    if (groupBy === "host") {
        if (type === "host") {
            return String(node.label || "host");
        }
        return hostMaps.hostLabelById.get(hostId) || "unassigned host";
    }
    if (groupBy === "category") {
        const categories = type === "host"
            ? normalizeCategoryList(graphPropertyValue(node, "device_categories"))
            : normalizeCategoryList(hostMaps.categoriesByHostId.get(hostId) || []);
        return categories.length ? categories.join(", ") : "uncategorized";
    }
    if (groupBy === "domain") {
        if (type === "fqdn") {
            return String(node.label || "domain");
        }
        return hostname || hostMaps.domainByHostId.get(hostId) || "undisclosed domain";
    }
    if (groupBy === "service") {
        if (type === "service") {
            return serviceName || String(node.label || "service");
        }
        if (type === "port") {
            return `${graphPropertyValue(node, "port") || ""}/${graphPropertyValue(node, "protocol") || ""}`.replace(/\/$/, "") || "port";
        }
        return serviceName || graphFriendlyLabel(type) || "other service";
    }
    if (groupBy === "finding") {
        if (type === "finding") {
            return String(graphPropertyValue(node, "title") || node.label || "finding");
        }
        return String(graphPropertyValue(node, "cve") || graphPropertyValue(node, "title") || graphPropertyValue(node, "severity") || graphFriendlyLabel(type) || "other");
    }
    if (type === "subnet") {
        return String(node.label || "subnet");
    }
    const ip = String(graphPropertyValue(node, "ip") || "").trim();
    if (ip) {
        return graphSubnetForIp(ip);
    }
    return hostMaps.subnetByHostId.get(hostId) || "other subnet";
}


export function graphSortNodes(left, right) {
    const leftType = String(left?.type || "").trim().toLowerCase();
    const rightType = String(right?.type || "").trim().toLowerCase();
    const leftIndex = GRAPH_TYPE_ORDER.indexOf(leftType);
    const rightIndex = GRAPH_TYPE_ORDER.indexOf(rightType);
    if (leftIndex !== rightIndex) {
        return (leftIndex === -1 ? GRAPH_TYPE_ORDER.length : leftIndex) - (rightIndex === -1 ? GRAPH_TYPE_ORDER.length : rightIndex);
    }
    return String(left?.label || "").localeCompare(String(right?.label || ""));
}


export function graphSeverityRank(entity) {
    const severity = String(graphPropertyValue(entity, "severity") || "").trim().toLowerCase();
    if (!severity) {
        return 99;
    }
    return Object.prototype.hasOwnProperty.call(GRAPH_SEVERITY_ORDER, severity)
        ? GRAPH_SEVERITY_ORDER[severity]
        : 80;
}


export function graphGroupTypePriority(nodeType, groupBy) {
    const type = String(nodeType || "").trim().toLowerCase();
    if (groupBy === "finding") {
        if (type === "finding") {
            return 0;
        }
        if (type === "cve" || type === "exploit_reference") {
            return 1;
        }
        if (["credential", "identity", "session"].includes(type)) {
            return 2;
        }
        if (["service", "url"].includes(type)) {
            return 3;
        }
        if (type === "technology" || type === "cpe") {
            return 4;
        }
        if (type === "screenshot") {
            return 5;
        }
        if (["host", "fqdn", "port", "subnet", "scope"].includes(type)) {
            return 6;
        }
        return 7;
    }
    if (groupBy === "service") {
        if (["service", "url"].includes(type)) {
            return 0;
        }
        if (type === "technology" || type === "cpe") {
            return 1;
        }
        if (["finding", "cve", "exploit_reference"].includes(type)) {
            return 2;
        }
        if (type === "screenshot") {
            return 3;
        }
        if (["host", "fqdn", "port"].includes(type)) {
            return 4;
        }
        return 5;
    }
    if (groupBy === "host" || groupBy === "domain" || groupBy === "subnet" || groupBy === "category") {
        if (["host", "fqdn", "subnet", "scope"].includes(type)) {
            return 0;
        }
        if (["service", "url", "port"].includes(type)) {
            return 1;
        }
        if (["finding", "cve", "exploit_reference"].includes(type)) {
            return 2;
        }
        if (["credential", "identity", "session"].includes(type)) {
            return 3;
        }
        if (type === "screenshot") {
            return 4;
        }
        return 5;
    }
    return 9;
}


export function graphNaturalCompare(left, right) {
    return String(left || "").localeCompare(String(right || ""), undefined, {
        numeric: true,
        sensitivity: "base",
    });
}


export function graphSortGroups(groupsMap, groupBy) {
    return Array.from(groupsMap.entries()).sort((left, right) => {
        const [leftKey, leftNodes] = left;
        const [rightKey, rightNodes] = right;
        const leftPriority = Math.min(...leftNodes.map((item) => graphGroupTypePriority(item?.type, groupBy)), 9);
        const rightPriority = Math.min(...rightNodes.map((item) => graphGroupTypePriority(item?.type, groupBy)), 9);
        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
        }
        const leftSeverity = Math.min(...leftNodes.map((item) => graphSeverityRank(item)), 99);
        const rightSeverity = Math.min(...rightNodes.map((item) => graphSeverityRank(item)), 99);
        if (leftSeverity !== rightSeverity) {
            return leftSeverity - rightSeverity;
        }
        const leftFindings = leftNodes.filter((item) => ["finding", "cve", "exploit_reference"].includes(String(item?.type || "").trim().toLowerCase())).length;
        const rightFindings = rightNodes.filter((item) => ["finding", "cve", "exploit_reference"].includes(String(item?.type || "").trim().toLowerCase())).length;
        if (leftFindings !== rightFindings) {
            return rightFindings - leftFindings;
        }
        return graphNaturalCompare(leftKey, rightKey);
    });
}


export function graphBuildNeighborMaps(edges) {
    const neighborMap = new Map();
    const degreeMap = new Map();
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
    neighborMap.forEach((neighbors, nodeId) => {
        degreeMap.set(String(nodeId || ""), neighbors.size);
    });
    return {neighborMap, degreeMap};
}


export function graphEstimateGroupGrid(nodeCount, totalNodes) {
    const count = Math.max(1, Number(nodeCount || 0));
    if (count <= 4) {
        return {columns: 1, rows: count};
    }
    const denseGraph = totalNodes >= 5000;
    const veryLargeGroup = count >= 240;
    const denseFactor = denseGraph ? 0.62 : totalNodes >= 2500 ? 0.56 : 0.48;
    const maxRows = denseGraph ? 24 : totalNodes >= 2500 ? 20 : veryLargeGroup ? 18 : 14;
    const minRows = count >= 80 ? 7 : count >= 20 ? 4 : 2;
    let columns = Math.max(1, Math.ceil(Math.sqrt(count * denseFactor)));
    let rows = Math.max(1, Math.ceil(count / columns));
    if (rows > maxRows) {
        rows = maxRows;
        columns = Math.max(1, Math.ceil(count / rows));
    } else if (rows < minRows && count > minRows) {
        rows = minRows;
        columns = Math.max(1, Math.ceil(count / rows));
    }
    return {columns, rows};
}


export function graphViewLanePriority(nodeType, viewId, groupBy) {
    const type = String(nodeType || "").trim().toLowerCase();
    const view = String(viewId || graphWorkspaceState.viewId || "attack_surface").trim().toLowerCase();
    if (view === "attack_surface") {
        if (type === "scope" || type === "subnet") {
            return 0;
        }
        if (type === "host" || type === "fqdn") {
            return 1;
        }
        if (type === "port" || type === "service") {
            return 2;
        }
        if (type === "url" || type === "screenshot") {
            return 3;
        }
        if (type === "technology" || type === "cpe") {
            return 4;
        }
        if (type === "finding" || type === "cve" || type === "exploit_reference") {
            return 5;
        }
        if (["credential", "identity", "session", "action", "artifact", "evidence_record"].includes(type)) {
            return 6;
        }
        return 7;
    }
    if (view === "host_service_topology") {
        if (type === "host" || type === "fqdn" || type === "subnet") {
            return 0;
        }
        if (type === "port" || type === "service") {
            return 1;
        }
        if (type === "url" || type === "screenshot") {
            return 2;
        }
        if (type === "technology" || type === "cpe") {
            return 3;
        }
        if (type === "finding" || type === "cve" || type === "exploit_reference") {
            return 4;
        }
        return 5;
    }
    if (view === "web_application_map") {
        if (type === "host" || type === "fqdn" || type === "service") {
            return 0;
        }
        if (type === "url" || type === "screenshot") {
            return 1;
        }
        if (type === "technology" || type === "cpe") {
            return 2;
        }
        if (type === "finding" || type === "cve" || type === "exploit_reference") {
            return 3;
        }
        return 4;
    }
    if (view === "credential_identity_session") {
        if (type === "host") {
            return 0;
        }
        if (type === "credential" || type === "identity" || type === "session") {
            return 1;
        }
        if (type === "action" || type === "artifact" || type === "evidence_record") {
            return 2;
        }
        return 3;
    }
    if (view === "exploitation_chain") {
        if (type === "host") {
            return 0;
        }
        if (type === "finding" || type === "cve" || type === "exploit_reference") {
            return 1;
        }
        if (type === "credential" || type === "identity" || type === "session") {
            return 2;
        }
        if (type === "action" || type === "artifact" || type === "screenshot" || type === "evidence_record") {
            return 3;
        }
        return 4;
    }
    return graphGroupTypePriority(type, groupBy);
}


export function graphEstimateLayoutTargetHeight(totalArea, totalNodes, laneCount) {
    const base = Math.sqrt(Math.max(totalArea, 1)) * (totalNodes >= 5000 ? 1.08 : 1.16);
    return Math.max(1100, Math.min(totalNodes >= 5000 ? 5600 : 4200, Math.round(base + (laneCount * 120))));
}


export function graphPackGroupsIntoLanes(groupInfos, targetHeight, groupGapX, groupGapY, outerPad) {
    const lanes = new Map();
    groupInfos.forEach((group) => {
        const laneKey = Number(group?.lane ?? 0);
        if (!lanes.has(laneKey)) {
            lanes.set(laneKey, []);
        }
        lanes.get(laneKey).push(group);
    });

    const orderedLanes = Array.from(lanes.entries()).sort((left, right) => Number(left[0]) - Number(right[0]));
    let globalX = outerPad;
    let maxHeight = 0;

    orderedLanes.forEach(([, laneGroups]) => {
        let localX = 0;
        let localY = outerPad;
        let currentColumnWidth = 0;
        let laneWidth = 0;
        let laneHeight = 0;
        laneGroups.forEach((group) => {
            if (localY > outerPad && (localY + group.height) > targetHeight) {
                localX += currentColumnWidth + groupGapX;
                localY = outerPad;
                currentColumnWidth = 0;
            }
            group.x = globalX + localX;
            group.y = localY;
            localY += group.height + groupGapY;
            currentColumnWidth = Math.max(currentColumnWidth, group.width);
            laneWidth = Math.max(laneWidth, localX + currentColumnWidth);
            laneHeight = Math.max(laneHeight, group.y + group.height);
        });
        globalX += laneWidth + (groupGapX * 2);
        maxHeight = Math.max(maxHeight, laneHeight + outerPad);
    });

    return {
        width: globalX,
        height: Math.max(maxHeight, 760),
    };
}


export function graphComputeCompactLayout(nodes, edges, groupsMap, groupBy, persistedPositions = {}) {
    const totalNodes = Array.isArray(nodes) ? nodes.length : 0;
    const nodeGapX = totalNodes >= 5000 ? 10 : totalNodes >= 2500 ? 12 : 16;
    const nodeGapY = totalNodes >= 5000 ? 8 : totalNodes >= 2500 ? 10 : 14;
    const groupGapX = totalNodes >= 5000 ? 20 : 26;
    const groupGapY = totalNodes >= 5000 ? 20 : 28;
    const groupPadX = totalNodes >= 5000 ? 14 : 18;
    const groupTopPad = 42;
    const groupBottomPad = totalNodes >= 5000 ? 12 : 18;
    const groupHeaderPad = 16;
    const outerPad = 20;
    const viewId = String(graphWorkspaceState.viewId || "attack_surface").trim();

    const nodeById = new Map((nodes || []).map((node) => [String(node?.node_id || ""), node]));
    const {neighborMap, degreeMap} = graphBuildNeighborMaps(edges);
    const groupEntries = graphSortGroups(groupsMap, groupBy);
    const nodeToGroup = new Map();
    groupEntries.forEach(([groupKey, groupNodes]) => {
        (groupNodes || []).forEach((node) => {
            nodeToGroup.set(String(node?.node_id || ""), String(groupKey || ""));
        });
    });

    const groupAdjacency = new Map();
    const groupDegree = new Map();
    (edges || []).forEach((edge) => {
        const fromId = String(edge?.from_node_id || "");
        const toId = String(edge?.to_node_id || "");
        const fromGroup = nodeToGroup.get(fromId);
        const toGroup = nodeToGroup.get(toId);
        if (!fromGroup || !toGroup || fromGroup === toGroup) {
            return;
        }
        const forwardKey = `${fromGroup}::${toGroup}`;
        const reverseKey = `${toGroup}::${fromGroup}`;
        groupAdjacency.set(forwardKey, Number(groupAdjacency.get(forwardKey) || 0) + 1);
        groupAdjacency.set(reverseKey, Number(groupAdjacency.get(reverseKey) || 0) + 1);
        groupDegree.set(fromGroup, Number(groupDegree.get(fromGroup) || 0) + 1);
        groupDegree.set(toGroup, Number(groupDegree.get(toGroup) || 0) + 1);
    });

    const groupInfos = groupEntries.map(([groupKey, groupNodes]) => {
        const key = String(groupKey || "");
        const orderedNodes = (groupNodes || []).slice().sort((left, right) => {
            const typeDelta = graphGroupTypePriority(left?.type, groupBy) - graphGroupTypePriority(right?.type, groupBy);
            if (typeDelta !== 0) {
                return typeDelta;
            }
            const severityDelta = graphSeverityRank(left) - graphSeverityRank(right);
            if (severityDelta !== 0) {
                return severityDelta;
            }
            const degreeDelta = Number(degreeMap.get(String(right?.node_id || "")) || 0) - Number(degreeMap.get(String(left?.node_id || "")) || 0);
            if (degreeDelta !== 0) {
                return degreeDelta;
            }
            const neighborDelta = Number((neighborMap.get(String(right?.node_id || "")) || new Set()).size) - Number((neighborMap.get(String(left?.node_id || "")) || new Set()).size);
            if (neighborDelta !== 0) {
                return neighborDelta;
            }
            return graphNaturalCompare(left?.label || "", right?.label || "");
        });
        const priority = Math.min(...orderedNodes.map((item) => graphGroupTypePriority(item?.type, groupBy)), 9);
        const severity = Math.min(...orderedNodes.map((item) => graphSeverityRank(item)), 99);
        const findings = orderedNodes.filter((item) => ["finding", "cve", "exploit_reference"].includes(String(item?.type || "").trim().toLowerCase())).length;
        const {columns, rows} = graphEstimateGroupGrid(orderedNodes.length, totalNodes);
        const width = Math.max(
            220,
            Math.round((groupPadX * 2) + (columns * GRAPH_NODE_SIZE.width) + (Math.max(0, columns - 1) * nodeGapX)),
        );
        const height = Math.max(
            132,
            Math.round(groupHeaderPad + groupTopPad + (rows * GRAPH_NODE_SIZE.height) + (Math.max(0, rows - 1) * nodeGapY) + groupBottomPad),
        );
        return {
            key,
            label: key,
            nodes: orderedNodes,
            nodeIds: orderedNodes.map((item) => String(item?.node_id || "")).filter(Boolean),
            priority,
            severity,
            findings,
            degree: Number(groupDegree.get(key) || 0),
            lane: Math.min(...orderedNodes.map((item) => graphViewLanePriority(item?.type, viewId, groupBy)), 99),
            columns,
            rows,
            width,
            height,
            area: width * height,
            x: outerPad,
            y: outerPad,
        };
    });

    groupInfos.sort((left, right) => {
        if (left.lane !== right.lane) {
            return left.lane - right.lane;
        }
        if (left.priority !== right.priority) {
            return left.priority - right.priority;
        }
        if (left.severity !== right.severity) {
            return left.severity - right.severity;
        }
        if (left.findings !== right.findings) {
            return right.findings - left.findings;
        }
        if (left.degree !== right.degree) {
            return right.degree - left.degree;
        }
        if (left.area !== right.area) {
            return right.area - left.area;
        }
        return graphNaturalCompare(left.key, right.key);
    });

    const totalArea = groupInfos.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const laneCount = new Set(groupInfos.map((item) => Number(item?.lane ?? 0))).size || 1;
    const targetHeight = graphEstimateLayoutTargetHeight(totalArea, totalNodes, laneCount);
    const packedGroups = graphPackGroupsIntoLanes(
        groupInfos,
        targetHeight,
        groupGapX,
        groupGapY,
        outerPad,
    );

    const positions = {};
    groupInfos.forEach((group) => {
        const rows = Math.max(1, Number(group.rows || 1));
        (group.nodes || []).forEach((node, index) => {
            const nodeId = String(node?.node_id || "");
            const column = Math.floor(index / rows);
            const row = index % rows;
            positions[nodeId] = {
                x: Math.round(group.x + groupPadX + (column * (GRAPH_NODE_SIZE.width + nodeGapX))),
                y: Math.round(group.y + groupTopPad + (row * (GRAPH_NODE_SIZE.height + nodeGapY))),
            };
        });
    });

    const livePositions = persistedPositions && typeof persistedPositions === "object" ? persistedPositions : {};
    Object.keys(livePositions).forEach((nodeId) => {
        if (!nodeById.has(String(nodeId || ""))) {
            return;
        }
        positions[nodeId] = {
            x: Math.max(outerPad, Math.round(Number(livePositions[nodeId]?.x) || 0)),
            y: Math.max(outerPad, Math.round(Number(livePositions[nodeId]?.y) || 0)),
        };
    });

    const renderedGroups = groupInfos.map((group) => {
        const groupNodeIds = Array.isArray(group.nodeIds) ? group.nodeIds : [];
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = 0;
        let maxY = 0;
        groupNodeIds.forEach((nodeId) => {
            const point = positions[String(nodeId || "")];
            if (!point) {
                return;
            }
            minX = Math.min(minX, Number(point.x) || 0);
            minY = Math.min(minY, Number(point.y) || 0);
            maxX = Math.max(maxX, (Number(point.x) || 0) + GRAPH_NODE_SIZE.width);
            maxY = Math.max(maxY, (Number(point.y) || 0) + GRAPH_NODE_SIZE.height);
        });
        if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
            return {
                key: group.key,
                label: group.label,
                x: group.x,
                y: group.y,
                width: group.width,
                height: group.height,
                nodeIds: groupNodeIds,
            };
        }
        return {
            key: group.key,
            label: group.label,
            x: Math.max(12, Math.round(minX - groupPadX)),
            y: Math.max(12, Math.round(minY - groupTopPad + 12)),
            width: Math.max(220, Math.round((maxX - minX) + (groupPadX * 2))),
            height: Math.max(132, Math.round((maxY - minY) + groupTopPad + groupBottomPad + 12)),
            nodeIds: groupNodeIds,
        };
    });

    let width = Math.max(Math.round(packedGroups.width || 1200), 1200);
    let height = Math.max(Math.round(packedGroups.height || 760), 760);
    Object.values(positions).forEach((point) => {
        width = Math.max(width, (Number(point?.x) || 0) + GRAPH_NODE_SIZE.width + 80);
        height = Math.max(height, (Number(point?.y) || 0) + GRAPH_NODE_SIZE.height + 120);
    });
    renderedGroups.forEach((group) => {
        width = Math.max(width, (Number(group?.x) || 0) + (Number(group?.width) || 0) + 48);
        height = Math.max(height, (Number(group?.y) || 0) + (Number(group?.height) || 0) + 48);
    });

    return {
        positions,
        groups: renderedGroups,
        width: Math.round(width),
        height: Math.round(height),
    };
}
