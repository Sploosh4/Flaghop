import { renderApprovals, renderDecisionRationaleFeed, renderDecisions, renderJobs } from "./activity.js";
import { closeHostRemoveModalAction } from "./dialogs.js";
import { makeCell, setText, setValue, setWorkspaceStatus } from "./dom.js";
import { graphRenderLayoutOptions, graphUpdateHostFilterOptions } from "./graph_common.js";
import { graphRenderWorkspace } from "./graph_render.js";
import { buildHostActionButton, buildLaunchToolButton } from "./host_actions.js";
import { makeCategoryCell, normalizeServiceFilterList, selectedHostServiceFilters, setHostServiceFilterAction, setServicesHostFilterAction, syncCategoryFilterOptions, syncHostFilterControls, syncHostServiceFilterOptions } from "./host_filters.js";
import { setServicesHostScope } from "./host_scope.js";
import { closeProcessOutputModal, closeScreenshotModal, closeScriptOutputModal, renderProcesses, renderSummary } from "./process_output.js";
import { graphWorkspaceState, workspaceState } from "./state.js";
import { openManualToolPicker, populateManualToolSelect } from "./tools.js";
import { loadHostDetail, loadWorkspaceServices } from "./workspace_data.js";
/** Workspace workspace view. */


export function clearHostDetailView({resetForms = true} = {}) {
    workspaceState.hostDetail = null;
    setText("host-detail-name", "");
    setValue("workspace-note", "");
    setValue("workspace-tool-host-ip", "");

    if (resetForms) {
        setValue("workspace-tool-port", "");
        setValue("workspace-tool-protocol", "tcp");
        setValue("workspace-script-id", "");
        setValue("workspace-script-port", "");
        setValue("workspace-script-protocol", "tcp");
        setValue("workspace-script-output", "");
        setValue("workspace-cve-name", "");
        setValue("workspace-cve-severity", "");
    }

    [
        "host-detail-ports",
        "host-detail-scripts",
        "host-detail-ai-technologies",
        "host-detail-ai-manual-tests",
        "host-detail-screenshots",
    ].forEach((id) => {
        const node = document.getElementById(id);
        if (node) {
            node.innerHTML = "";
        }
    });

    setText("host-ai-analysis-status", "");
    setText("host-ai-tech-count", 0);
    setText("host-ai-manual-count", 0);
    setText("host-screenshot-count", 0);
}


export function resetWorkspaceDisplayForProjectSwitch({clearProjectPaths = false} = {}) {
    workspaceState.hosts = [];
    workspaceState.hostFilter = "hide_down";
    workspaceState.hostServiceFilter = "";
    workspaceState.hostCategoryFilter = "";
    workspaceState.servicesHostFilterId = 0;
    workspaceState.servicesHostFilterLabel = "";
    workspaceState.servicesCategoryFilter = "";
    workspaceState.deviceCategoryRules = [];
    workspaceState.builtInDeviceCategories = [];
    workspaceState.services = [];
    workspaceState.tools = [];
    workspaceState.toolsHydrated = false;
    workspaceState.toolsLoading = false;
    workspaceState.selectedHostId = null;
    workspaceState.hostDetail = null;
    graphWorkspaceState.data = {nodes: [], edges: [], meta: {}};
    graphWorkspaceState.filtered = {nodes: [], edges: [], groups: [], positions: {}, width: 1600, height: 900};
    graphWorkspaceState.activeLayoutId = "";
    graphWorkspaceState.positions = {};
    graphWorkspaceState.pinnedNodeIds = {};
    graphWorkspaceState.selectedKind = "";
    graphWorkspaceState.selectedRef = "";
    graphWorkspaceState.selectedPayload = null;
    graphWorkspaceState.metadataLoaded = false;
    graphWorkspaceState.layouts = [];
    graphWorkspaceState.annotations = [];

    renderSummary({
        hosts: 0,
        open_ports: 0,
        services: 0,
        cves: 0,
        running_processes: 0,
        finished_processes: 0,
    });
    renderDecisionRationaleFeed([]);
    renderHosts([]);
    renderServices([]);
    renderTools([]);
    renderProcesses([]);
    renderDecisions([]);
    renderApprovals([]);
    renderJobs([]);
    clearHostDetailView({resetForms: true});
    closeProcessOutputModal(true);
    closeScriptOutputModal(true);
    closeScreenshotModal(true);
    closeHostRemoveModalAction(true);
    graphUpdateHostFilterOptions();
    graphRenderLayoutOptions();
    graphRenderWorkspace();

    if (clearProjectPaths) {
        setValue("project-open-path", "");
        setValue("project-save-path", "");
    }
}


export function renderHostSelector(hosts) {
    const select = document.getElementById("workspace-host-select");
    if (!select) {
        return;
    }
    const previous = workspaceState.selectedHostId;
    select.innerHTML = "";

    hosts.forEach((host) => {
        const option = document.createElement("option");
        option.value = String(host.id);
        option.textContent = `${host.ip || ""} ${host.hostname ? `(${host.hostname})` : ""}`.trim();
        select.appendChild(option);
    });

    if (!hosts.length) {
        workspaceState.selectedHostId = null;
        clearHostDetailView({resetForms: true});
        return;
    }

    const hasPrevious = hosts.some((host) => String(host.id) === String(previous));
    workspaceState.selectedHostId = hasPrevious ? previous : hosts[0].id;
    select.value = String(workspaceState.selectedHostId);
}




export function renderHostSelectionState({syncGraph = false, preserveGraphDetail = true} = {}) {
    const selectedHostId = String(workspaceState.selectedHostId || "");
    const select = document.getElementById("workspace-host-select");
    if (select) {
        const hasSelectedOption = Array.from(select.options || []).some((option) => {
            return String(option.value || "") === selectedHostId;
        });
        if (hasSelectedOption) {
            select.value = selectedHostId;
        } else {
            select.value = "";
        }
    }

    const body = document.getElementById("hosts-body");
    if (body) {
        Array.from(body.querySelectorAll("tr[data-host-id]")).forEach((row) => {
            const isSelected = selectedHostId && String(row.dataset.hostId || "") === selectedHostId;
            row.classList.toggle("is-selected", Boolean(isSelected));
            row.setAttribute("aria-selected", isSelected ? "true" : "false");
        });
    }

    if (syncGraph) {
        graphRenderWorkspace({preserveDetail: preserveGraphDetail});
    }
}


export async function selectHost(hostId, {loadDetail = true, syncGraph = true, preserveGraphDetail = true} = {}) {
    const normalizedHostId = parseInt(hostId, 10);
    if (!Number.isFinite(normalizedHostId) || normalizedHostId <= 0) {
        workspaceState.selectedHostId = null;
        workspaceState.hostDetail = null;
        const servicesScopeChanged = setServicesHostScope(0);
        clearHostDetailView({resetForms: true});
        renderHostSelectionState({syncGraph, preserveGraphDetail});
        if (servicesScopeChanged) {
            await loadWorkspaceServices();
        }
        return;
    }

    const hostChanged = String(workspaceState.selectedHostId || "") !== String(normalizedHostId);
    workspaceState.selectedHostId = normalizedHostId;
    const servicesScopeChanged = setServicesHostScope(normalizedHostId);
    renderHostSelectionState({syncGraph, preserveGraphDetail});

    const tasks = [];
    if (servicesScopeChanged) {
        syncHostFilterControls();
        renderHosts(workspaceState.hosts);
        tasks.push(loadWorkspaceServices());
    }
    if (loadDetail && (hostChanged || !workspaceState.hostDetail)) {
        workspaceState.hostDetail = null;
        tasks.push(loadHostDetail(normalizedHostId));
    }
    try {
        await Promise.all(tasks);
    } catch (err) {
        setWorkspaceStatus(`Load host detail failed: ${err.message}`, true);
    }
}


export function renderHosts(hosts) {
    workspaceState.hosts = Array.isArray(hosts) ? hosts : [];
    const body = document.getElementById("hosts-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    workspaceState.hosts.forEach((host) => {
        const tr = document.createElement("tr");
        tr.dataset.hostId = String(host.id || "");
        const filterCell = document.createElement("td");
        filterCell.className = "host-filter-cell";
        const filterButton = document.createElement("button");
        filterButton.type = "button";
        filterButton.className = "icon-btn";
        const hostLabel = String(host.hostname || host.ip || `host ${host.id || ""}`).trim();
        const isServicesFilterActive = parseInt(workspaceState.servicesHostFilterId, 10) === parseInt(host.id, 10);
        const filterLabel = isServicesFilterActive
            ? `Clear services filter for ${hostLabel}`
            : `Show services for ${hostLabel}`;
        filterButton.title = filterLabel;
        filterButton.setAttribute("aria-label", filterLabel);
        filterButton.innerHTML = '<i class="fa-solid fa-filter" aria-hidden="true"></i>';
        filterButton.classList.toggle("is-active", isServicesFilterActive);
        filterButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await setServicesHostFilterAction(host.id || 0, hostLabel);
        });
        filterCell.appendChild(filterButton);
        tr.appendChild(filterCell);
        const ipCell = document.createElement("td");
        const ipWrap = document.createElement("span");
        const icon = document.createElement("i");
        const osIcon = getHostOsIcon(host.os || "");
        icon.className = `${osIcon.className} host-os-icon`;
        icon.setAttribute("aria-hidden", "true");
        const rawOs = String(host.raw_os || "").trim();
        const resolvedOs = String(host.os || "").trim();
        const osTitle = rawOs && resolvedOs && rawOs !== resolvedOs
            ? `${osIcon.label}; imported OS: ${rawOs}`
            : osIcon.label;
        icon.title = osTitle;
        ipWrap.className = "host-ip-with-icon";
        ipWrap.appendChild(icon);
        ipWrap.appendChild(document.createTextNode(host.ip || ""));
        ipCell.appendChild(ipWrap);
        tr.appendChild(ipCell);
        tr.appendChild(makeCell(host.hostname));
        tr.appendChild(makeCell(host.status));
        const osCell = makeCell(host.os);
        if (rawOs && resolvedOs && rawOs !== resolvedOs) {
            osCell.title = `Resolved from stronger service evidence. Imported OS: ${rawOs}`;
        }
        tr.appendChild(osCell);
        tr.appendChild(makeCategoryCell(host.categories || []));
        tr.appendChild(makeCell(host.open_ports));
        const actionsCell = document.createElement("td");
        actionsCell.className = "host-actions";
        const launchButton = buildLaunchToolButton(`Run supported tool for ${hostLabel}`);
        launchButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await openManualToolPicker({
                hostId: Number(host.id) || 0,
                contextLabel: `Supported tools for ${hostLabel}`,
            });
        });
        actionsCell.appendChild(launchButton);
        ["rescan", "refresh-screenshots", "dig-deeper", "remove"].forEach((action) => {
            actionsCell.appendChild(buildHostActionButton(action, host.id || ""));
        });

        tr.appendChild(actionsCell);
        body.appendChild(tr);
    });
    setText("host-count", workspaceState.hosts.length);
    renderHostSelector(workspaceState.hosts);
    renderHostSelectionState();
    syncCategoryFilterOptions();
    syncHostServiceFilterOptions();
    graphUpdateHostFilterOptions();
}


export function hostMatchesServiceFilter(host, serviceFilter) {
    const filters = normalizeServiceFilterList(serviceFilter);
    if (!filters.length) {
        return true;
    }
    const filterKeys = new Set(filters.map((item) => item.toLowerCase()));
    return Array.isArray(host?.services)
        && host.services.some((item) => filterKeys.has(String(item || "").trim().toLowerCase()));
}


export function renderServices(services) {
    workspaceState.services = Array.isArray(services) ? services : [];
    const body = document.getElementById("services-body");
    if (!body) {
        return;
    }
    body.innerHTML = "";
    workspaceState.services.forEach((service) => {
        const tr = document.createElement("tr");
        const filterCell = document.createElement("td");
        const filterButton = document.createElement("button");
        filterButton.type = "button";
        filterButton.className = "icon-btn";
        filterButton.title = `Show hosts for ${service.service || "service"}`;
        filterButton.setAttribute("aria-label", `Show hosts for ${service.service || "service"}`);
        filterButton.innerHTML = '<i class="fa-solid fa-filter" aria-hidden="true"></i>';
        const selectedServices = selectedHostServiceFilters().map((item) => item.toLowerCase());
        if (selectedServices.includes(String(service.service || "").trim().toLowerCase())) {
            filterButton.classList.add("is-active");
        }
        filterButton.addEventListener("click", async () => {
            await setHostServiceFilterAction(service.service || "");
        });
        filterCell.className = "service-filter-cell";
        filterCell.appendChild(filterButton);
        tr.appendChild(filterCell);
        tr.appendChild(makeCell(service.service || ""));
        tr.appendChild(makeCell(Array.isArray(service.ports) ? service.ports.join(", ") : ""));
        tr.appendChild(makeCell(service.host_count || 0));
        tr.appendChild(makeCell(service.port_count || 0));
        tr.appendChild(makeCell(Array.isArray(service.protocols) ? service.protocols.join(",") : ""));
        tr.appendChild(makeCategoryCell(service.categories || []));
        const actionsCell = document.createElement("td");
        const launchButton = buildLaunchToolButton(`Run supported tool for ${service.service || "service"}`);
        launchButton.addEventListener("click", async () => {
            await openManualToolPicker({
                hostId: Number(workspaceState.servicesHostFilterId) || 0,
                service: String(service.service || "").trim(),
                contextLabel: workspaceState.servicesHostFilterId
                    ? `Supported tools for ${service.service || "service"} on ${workspaceState.servicesHostFilterLabel || "selected host"}`
                    : `Supported tools for ${service.service || "service"}`,
            });
        });
        actionsCell.appendChild(launchButton);
        tr.appendChild(actionsCell);
        body.appendChild(tr);
    });
    setText("service-count", workspaceState.services.length);
    const scopeLabel = document.getElementById("services-scope-label");
    if (scopeLabel) {
        const label = String(workspaceState.servicesHostFilterLabel || "").trim();
        scopeLabel.textContent = label ? `for ${label}` : "all hosts";
        scopeLabel.hidden = false;
    }
    syncHostServiceFilterOptions();
}


export function setServicesPanelCollapsed(collapsed) {
    const body = document.getElementById("services-panel-body");
    const button = document.getElementById("services-panel-toggle-button");
    if (!body || !button) {
        return;
    }
    const nextCollapsed = Boolean(collapsed);
    body.hidden = nextCollapsed;
    button.classList.toggle("is-collapsed", nextCollapsed);
    button.setAttribute("aria-expanded", nextCollapsed ? "false" : "true");
    button.title = nextCollapsed ? "Show Services" : "Hide Services";
    button.setAttribute("aria-label", nextCollapsed ? "Show Services" : "Hide Services");
}


export function toggleServicesPanelAction() {
    const body = document.getElementById("services-panel-body");
    if (!body) {
        return;
    }
    setServicesPanelCollapsed(!body.hidden);
}


export function setGraphPanelCollapsed(collapsed) {
    const body = document.getElementById("graph-panel-body");
    const button = document.getElementById("graph-panel-toggle-button");
    if (!body || !button) {
        return;
    }
    const nextCollapsed = Boolean(collapsed);
    body.hidden = nextCollapsed;
    button.classList.toggle("is-collapsed", nextCollapsed);
    button.setAttribute("aria-expanded", nextCollapsed ? "false" : "true");
    button.title = nextCollapsed ? "Show Graph Workspace" : "Hide Graph Workspace";
    button.setAttribute("aria-label", nextCollapsed ? "Show Graph Workspace" : "Hide Graph Workspace");
}


export function toggleGraphPanelAction() {
    const body = document.getElementById("graph-panel-body");
    if (!body) {
        return;
    }
    setGraphPanelCollapsed(!body.hidden);
}


export function getHostOsIcon(osText) {
    const token = String(osText || "").toLowerCase();
    if (token.includes("windows") || token.includes("microsoft")) {
        return {className: "fa-brands fa-windows", label: "Windows"};
    }
    if (token.includes("linux") || token.includes("ubuntu") || token.includes("debian") || token.includes("centos")) {
        return {className: "fa-brands fa-linux", label: "Linux"};
    }
    if (token.includes("darwin") || token.includes("mac os") || token.includes("osx") || token.includes("macos")) {
        return {className: "fa-brands fa-apple", label: "macOS"};
    }
    if (token.includes("solaris") || token.includes("sunos")) {
        return {className: "fa-solid fa-sun", label: "Solaris"};
    }
    if (token.includes("freebsd") || token.includes("openbsd") || token.includes("netbsd") || token.includes("unix")) {
        return {className: "fa-solid fa-terminal", label: "Unix"};
    }
    if (token.includes("cisco")) {
        return {className: "fa-solid fa-network-wired", label: "Network device"};
    }
    return {className: "fa-solid fa-computer", label: "Unknown OS"};
}


export function renderTools(tools) {
    workspaceState.tools = Array.isArray(tools) ? tools : [];
    const body = document.getElementById("tools-body");
    if (body) {
        body.innerHTML = "";
        workspaceState.tools.forEach((tool) => {
            const tr = document.createElement("tr");
            tr.dataset.toolId = String(tool.tool_id || "");
            tr.appendChild(makeCell(tool.label || ""));
            tr.appendChild(makeCell(tool.tool_id || ""));
            tr.appendChild(makeCell(tool.run_count || 0));
            tr.appendChild(makeCell(tool.last_status || ""));
            tr.appendChild(makeCell(Array.isArray(tool.danger_categories) ? tool.danger_categories.join(",") : ""));
            body.appendChild(tr);
        });
    }

    if (!workspaceState.manualToolTargets.length) {
        populateManualToolSelect(workspaceState.tools);
    }

    setText("tool-count", workspaceState.tools.length);
}
