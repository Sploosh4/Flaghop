/** Shared workspace models. Domain modules mutate these objects in response to explicit actions. */

export const workspaceState = {
    hosts: [],
    hostFilter: "hide_down",
    hostServiceFilter: "",
    hostServiceFilters: [],
    hostCategoryFilter: "",
    servicesHostFilterId: 0,
    servicesHostFilterLabel: "",
    servicesCategoryFilter: "",
    services: [],
    tools: [],
    toolsHydrated: false,
    toolsLoading: false,
    selectedHostId: null,
    hostDetail: null,
    manualToolTargets: [],
    manualToolOptions: [],
    deviceCategoryRules: [],
    builtInDeviceCategories: [],
};

export const GRAPH_WORKSPACE_ZOOM_MIN_PERCENT = 10;

export const GRAPH_WORKSPACE_ZOOM_MAX_PERCENT = 400;

const scanPresets = JSON.parse(document.getElementById("scan-presets")?.textContent || "{}");
export const INTERNAL_QUICK_RECON_TCP_PORTS = scanPresets.quick || "";

export const RFC1918_COMPREHENSIVE_TCP_PORTS = scanPresets.comprehensive || "";

export const graphWorkspaceState = {
    resize: null,
    viewId: "attack_surface",
    groupBy: "finding",
    renderMode: "auto",
    zoomPercent: 100,
    detailMode: "floating",
    filtersExpanded: false,
    data: {
        nodes: [],
        edges: [],
        meta: {},
    },
    filtered: {
        nodes: [],
        edges: [],
        groups: [],
        positions: {},
        width: 1600,
        height: 900,
    },
    loading: false,
    needsRefresh: false,
    refreshTimer: null,
    focusDepth: 1,
    focusSeedNodeIds: [],
    focusSeedLabel: "",
    expandedSummaryIds: {},
    metadataLoaded: false,
    layouts: [],
    activeLayoutId: "",
    positions: {},
    pinnedNodeIds: {},
    selectedKind: "",
    selectedRef: "",
    selectedPayload: null,
    relatedContent: [],
    toolMenuCache: {},
    contentRequestId: 0,
    annotations: [],
    drag: null,
    suppressClickUntil: 0,
    viewport: null,
};

export const workspaceInvalidateState = {
    pendingChannels: new Set(),
    running: false,
    timer: null,
};

export const workspaceInvalidationWaiters = [];

export const toolAuditState = {
    recommendedPlatform: "",
    supportedPlatforms: ["kali", "ubuntu"],
    plan: null,
};

export const GRAPH_WORKSPACE_HEIGHT_STORAGE_KEY = "legion.graphWorkspaceHeightPx";

export const GRAPH_WORKSPACE_DEFAULT_HEIGHT = 680;

export const GRAPH_WORKSPACE_MIN_HEIGHT = 520;

export const GRAPH_WORKSPACE_MAX_HEIGHT = 1600;

export const GRAPH_EDGE_HIGHLIGHT_COLOR = "#ff9f43";

export const GRAPH_SOURCE_KIND_LABELS = {
    observed: "observed",
    inferred: "inferred",
    ai_suggested: "ai suggested",
    user_entered: "user entered",
};

export const GRAPH_SOURCE_KIND_STYLES = {
    observed: {
        stroke: "#7ee3cb",
        edgeStroke: "#5f8f89",
        fill: "rgba(126, 227, 203, 0.16)",
        fillOpaque: "#17322f",
        dash: "",
    },
    inferred: {
        stroke: "#f1cd6b",
        edgeStroke: "#9d8555",
        fill: "rgba(241, 205, 107, 0.16)",
        fillOpaque: "#3a3118",
        dash: "7 5",
    },
    ai_suggested: {
        stroke: "#a38dff",
        edgeStroke: "#756ca8",
        fill: "rgba(163, 141, 255, 0.16)",
        fillOpaque: "#282042",
        dash: "2 5",
    },
    user_entered: {
        stroke: "#9ad2ff",
        edgeStroke: "#6e93ac",
        fill: "rgba(154, 210, 255, 0.16)",
        fillOpaque: "#1d3141",
        dash: "",
    },
};

export const GRAPH_NODE_COLORS = {
    scope: "#9ad2ff",
    subnet: "#7b83ff",
    host: "#86d993",
    fqdn: "#98d6ff",
    port: "#f0c96f",
    service: "#ff9c6f",
    url: "#6ce0c7",
    technology: "#8ac7ff",
    cpe: "#b4bbdd",
    cve: "#ff7c99",
    finding: "#ff6f91",
    credential: "#ffd37b",
    identity: "#ffe7a8",
    session: "#69d4ff",
    exploit_reference: "#ffb16f",
    screenshot: "#8fd0ff",
    artifact: "#9bc9b7",
    action: "#d1a8ff",
    evidence_record: "#b7bdd8",
};

export const GRAPH_NODE_SIZE = {
    width: 148,
    height: 58,
};

export const GRAPH_SEVERITY_ORDER = {
    critical: 0,
    high: 1,
    medium: 2,
    moderate: 2,
    low: 3,
    info: 4,
    informational: 4,
};

export const GRAPH_LARGE_NODE_THRESHOLD = 1000;

export const GRAPH_LARGE_EDGE_THRESHOLD = 3000;

export const GRAPH_MATRIX_NODE_THRESHOLD = 1600;

export const GRAPH_MATRIX_EDGE_THRESHOLD = 4500;

export const GRAPH_MATRIX_GROUP_LIMIT = 24;

export const GRAPH_GROUP_LABEL_MIN_ZOOM = 55;

export const GRAPH_NODE_LABEL_MIN_ZOOM = 60;

export const GRAPH_NODE_TYPE_MIN_ZOOM = 78;

// Kept for shared modal/keyboard coordination; React owns output sessions.
export const processOutputState = {modalOpen: false};

export const scriptOutputState = {
    scriptDbId: null,
    processId: 0,
    scriptId: "",
    source: "",
    output: "",
    command: "",
    status: "",
    downloadName: "",
    modalOpen: false,
};



export const hostRemoveState = {
    modalOpen: false,
    hostId: null,
    hostIp: "",
    hostName: "",
};

export const nmapWizardState = {
    step: 1,
    lastMode: "",
    lastEngagementPreset: "",
    postSubmitLock: true,
    captureInterfacesLoaded: false,
};


export const workspaceSwitchGuardState = {
    modalOpen: false,
    busy: false,
    pendingAction: null,
    pendingLabel: "",
    latestSummary: null,
};

export const uiModalState = {
    schedulerOpen: false,
    interfaceSettingsOpen: false,
    deviceCategorySettingsOpen: false,
    settingsOpen: false,
    nmapScanOpen: false,
    manualScanOpen: false,
    hostRemoveOpen: false,
    graphNoteOpen: false,
    workspaceSwitchGuardOpen: false,
};

export const ribbonMenuState = {
    openMenuId: null,
};

export const ANSI_FG_CLASS_BY_CODE = {
    30: "ansi-fg-black",
    31: "ansi-fg-red",
    32: "ansi-fg-green",
    33: "ansi-fg-yellow",
    34: "ansi-fg-blue",
    35: "ansi-fg-magenta",
    36: "ansi-fg-cyan",
    37: "ansi-fg-white",
    90: "ansi-fg-bright-black",
    91: "ansi-fg-bright-red",
    92: "ansi-fg-bright-green",
    93: "ansi-fg-bright-yellow",
    94: "ansi-fg-bright-blue",
    95: "ansi-fg-bright-magenta",
    96: "ansi-fg-bright-cyan",
    97: "ansi-fg-bright-white",
};

export const ANSI_BG_CLASS_BY_CODE = {
    40: "ansi-bg-black",
    41: "ansi-bg-red",
    42: "ansi-bg-green",
    43: "ansi-bg-yellow",
    44: "ansi-bg-blue",
    45: "ansi-bg-magenta",
    46: "ansi-bg-cyan",
    47: "ansi-bg-white",
    100: "ansi-bg-bright-black",
    101: "ansi-bg-bright-red",
    102: "ansi-bg-bright-green",
    103: "ansi-bg-bright-yellow",
    104: "ansi-bg-bright-blue",
    105: "ansi-bg-bright-magenta",
    106: "ansi-bg-bright-cyan",
    107: "ansi-bg-bright-white",
};

export const GRAPH_VIEW_PRESETS = {
    attack_surface: {
        label: "attack surface",
        defaultGroup: "finding",
        nodeTypes: ["scope", "subnet", "host", "fqdn", "port", "service", "url", "technology", "finding", "cpe", "cve", ],
    },
    host_service_topology: {
        label: "host/service topology",
        defaultGroup: "host",
        nodeTypes: ["host", "fqdn", "port", "service", "technology", "url", "action", "evidence_record", "artifact", ],
    },
    exploitation_chain: {
        label: "exploitation chain",
        defaultGroup: "finding",
        nodeTypes: ["host", "finding", "cve", "exploit_reference", "credential", "identity", "session", "action", "artifact", "evidence_record"],
        edgeTypes: ["contains", "affected_by", "supports_exploit", "validated_by", "authenticated_as", "pivoted_to", "produced", "derived_from"],
    },
};

export const GRAPH_TYPE_ORDER = [
    "finding",
    "cve",
    "exploit_reference",
    "credential",
    "identity",
    "session",
    "scope",
    "subnet",
    "host",
    "fqdn",
    "service",
    "url",
    "port",
    "technology",
    "cpe",
    "action",
    "artifact",
    "evidence_record",
];
