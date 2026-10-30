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

export const INTERNAL_QUICK_RECON_TCP_PORTS = "80,81,88,111,135,139,443,445,515,591,593,623,631,2049,8000,8008,8010,8080,8081,8088,8443,8888,9000,9090,9100,9443,10443";

export const RFC1918_COMPREHENSIVE_TCP_PORTS = "22,25,53,80,81,88,110,111,123,135,139,143,389,443,445,465,500,515,587,591,593,623,631,636,993,995,1025,1433,1521,2049,2375,2376,3000,3306,3389,5000,5432,5601,5672,5900,5985,5986,6379,7001,8000,8008,8010,8080,8081,8088,8443,8888,9000,9090,9100,9200,9443,10443,27017";

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
    recommendedPlatform: "kali",
    supportedPlatforms: ["kali", "ubuntu"],
    plan: null,
};

export const GRAPH_WORKSPACE_HEIGHT_STORAGE_KEY = "legion.graphWorkspaceHeightPx";

export const GRAPH_WORKSPACE_DEFAULT_HEIGHT = 680;

export const GRAPH_WORKSPACE_MIN_HEIGHT = 520;

export const GRAPH_WORKSPACE_MAX_HEIGHT = 1600;

export const GRAPH_EDGE_HIGHLIGHT_COLOR = "#ff9f43";

export const GRAPH_VIEW_PRESETS = {
    attack_surface: {
        label: "attack surface",
        defaultGroup: "finding",
        nodeTypes: ["scope", "subnet", "host", "fqdn", "port", "service", "url", "technology", "finding", "cpe", "cve", "screenshot"],
    },
    host_service_topology: {
        label: "host/service topology",
        defaultGroup: "host",
        nodeTypes: ["host", "fqdn", "port", "service", "technology", "url", "action", "evidence_record", "artifact", "screenshot"],
    },
    web_application_map: {
        label: "web application map",
        defaultGroup: "service",
        nodeTypes: ["host", "fqdn", "service", "url", "technology", "finding", "cpe", "cve", "screenshot", "artifact", "action"],
    },
    credential_identity_session: {
        label: "credential / identity / session",
        defaultGroup: "host",
        nodeTypes: ["host", "credential", "identity", "session", "action", "artifact", "evidence_record"],
        edgeTypes: ["contains", "authenticated_as", "captured", "produced", "pivoted_to", "validated_by"],
    },
    exploitation_chain: {
        label: "exploitation chain",
        defaultGroup: "finding",
        nodeTypes: ["host", "finding", "cve", "exploit_reference", "credential", "identity", "session", "action", "artifact", "screenshot", "evidence_record"],
        edgeTypes: ["contains", "affected_by", "supports_exploit", "validated_by", "authenticated_as", "pivoted_to", "produced", "derived_from"],
    },
};

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
    "screenshot",
    "action",
    "artifact",
    "evidence_record",
];

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

export const processOutputState = {
    processId: null,
    offset: 0,
    complete: true,
    status: "",
    text: "",
    modalOpen: false,
    refreshTimer: null,
    refreshInFlight: false,
};

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

export const screenshotModalState = {
    modalOpen: false,
    url: "",
    filename: "",
    port: "",
};

export const providerLogsState = {
    modalOpen: false,
    text: "",
    count: 0,
};

export const credentialCaptureState = {
    panelEnabled: true,
    captures: [],
    dedupedHashes: [],
    responder: {config: {}, session: {}},
    ntlmrelayx: {config: {}, session: {}},
    modalOpen: false,
    configModalOpen: false,
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

export const PROCESS_OUTPUT_REFRESH_MS = 2000;

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
    reportProviderOpen: false,
    settingsOpen: false,
    nmapScanOpen: false,
    manualScanOpen: false,
    hostSelectionOpen: false,
    scriptCveOpen: false,
    providerLogsOpen: false,
    credentialsOpen: false,
    credentialCaptureConfigOpen: false,
    jobsOpen: false,
    submittedScansOpen: false,
    schedulerDecisionsOpen: false,
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
