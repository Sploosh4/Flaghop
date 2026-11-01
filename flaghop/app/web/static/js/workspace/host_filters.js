
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let closeRibbonMenus, graphLoadSnapshot, loadHostDetail, loadWorkspaceHosts, loadWorkspaceServices, renderHosts, renderServices;
export function connectHostFilters(callbacks) {
    for (const name of ["closeRibbonMenus", "graphLoadSnapshot", "loadHostDetail", "loadWorkspaceHosts", "loadWorkspaceServices", "renderHosts", "renderServices"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing host_filters callback: ${name}`);
    }
    ({ closeRibbonMenus, graphLoadSnapshot, loadHostDetail, loadWorkspaceHosts, loadWorkspaceServices, renderHosts, renderServices } = callbacks);
}

import { setValue } from "./dom.js";
import { setServicesHostScope } from "./host_scope.js";
import { workspaceState } from "./state.js";
/** Workspace host filters. */

export function normalizeCategoryList(items) {
    if (!Array.isArray(items)) {
        return [];
    }
    const seen = new Set();
    const rows = [];
    items.forEach((item) => {
        const name = String(typeof item === "string" ? item : item?.name || "").trim();
        if (!name) {
            return;
        }
        const key = name.toLowerCase();
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        rows.push(name);
    });
    return rows;
}


export function normalizeServiceFilterList(items) {
    const source = Array.isArray(items) ? items : String(items || "").split(",");
    const seen = new Set();
    const rows = [];
    source.forEach((item) => {
        const value = String(item || "").trim();
        const key = value.toLowerCase();
        if (!value || seen.has(key)) {
            return;
        }
        seen.add(key);
        rows.push(value);
    });
    return rows;
}


export function selectedHostServiceFilters() {
    const selected = normalizeServiceFilterList(workspaceState.hostServiceFilters || []);
    if (selected.length) {
        return selected;
    }
    return normalizeServiceFilterList(workspaceState.hostServiceFilter || "");
}


export function hostServiceFilterLabel() {
    return selectedHostServiceFilters().join(", ");
}


export function renderCategoryChipList(target, categories, emptyText = "No categories") {
    const node = typeof target === "string" ? document.getElementById(target) : target;
    if (!node) {
        return;
    }
    const names = normalizeCategoryList(categories);
    node.innerHTML = "";
    if (!names.length) {
        const empty = document.createElement("span");
        empty.className = "category-chip category-chip-empty";
        empty.textContent = emptyText;
        node.appendChild(empty);
        return;
    }
    names.forEach((name) => {
        const chip = document.createElement("span");
        chip.className = "category-chip";
        chip.textContent = name;
        node.appendChild(chip);
    });
}


export function makeCategoryCell(categories) {
    const td = document.createElement("td");
    td.className = "category-cell";
    renderCategoryChipList(td, categories, "Uncategorized");
    td.title = normalizeCategoryList(categories).join(", ");
    return td;
}


export function collectWorkspaceCategoryOptions() {
    const seen = new Set();
    const rows = [];
    (workspaceState.hosts || []).forEach((host) => {
        normalizeCategoryList(host?.categories || []).forEach((name) => {
            const key = name.toLowerCase();
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            rows.push(name);
        });
    });
    rows.sort((left, right) => left.localeCompare(right));
    return rows;
}


export function syncCategoryFilterOptions() {
    const options = collectWorkspaceCategoryOptions();
    ["hosts-category-filter-select", "services-category-filter-select"].forEach((id) => {
        const select = document.getElementById(id);
        if (!select) {
            return;
        }
        const previous = String(select.value || "");
        select.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "all categories";
        select.appendChild(defaultOption);
        options.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        if (options.some((name) => String(name || "") === previous)) {
            select.value = previous;
        }
    });
}


export function collectWorkspaceServiceOptions() {
    const rowsByKey = new Map();
    const addService = (name, hostCount = 0) => {
        const value = String(name || "").trim();
        const key = value.toLowerCase();
        if (!value) {
            return;
        }
        const count = Number(hostCount || 0);
        const existing = rowsByKey.get(key);
        if (existing) {
            return;
        }
        rowsByKey.set(key, {
            service: value,
            host_count: Number.isFinite(count) ? count : 0,
        });
    };

    const visibleHostCounts = new Map();
    (workspaceState.hosts || []).forEach((host) => {
        const hostServices = new Map();
        (host?.services || []).forEach((service) => {
            const value = String(service || "").trim();
            const key = value.toLowerCase();
            if (value && !hostServices.has(key)) {
                hostServices.set(key, value);
            }
        });
        hostServices.forEach((value, key) => {
            const existing = visibleHostCounts.get(key) || {service: value, host_count: 0};
            existing.host_count += 1;
            visibleHostCounts.set(key, existing);
        });
    });

    visibleHostCounts.forEach((service) => {
        addService(service.service, service.host_count);
    });
    (workspaceState.services || []).forEach((service) => {
        addService(service?.service || "", service?.host_count || 0);
    });
    selectedHostServiceFilters().forEach((service) => addService(service, 0));
    const rows = Array.from(rowsByKey.values());
    rows.sort((left, right) => left.service.localeCompare(right.service));
    return rows;
}


export function syncHostServiceFilterOptions() {
    const list = document.getElementById("hosts-service-filter-list");
    const button = document.getElementById("hosts-service-filter-button");
    const clearButton = document.getElementById("hosts-service-filter-clear-button");
    const selected = selectedHostServiceFilters();
    const selectedKeys = new Set(selected.map((item) => item.toLowerCase()));
    const label = hostServiceFilterLabel();
    if (button) {
        button.textContent = selected.length ? `Services (${selected.length})` : "Services";
        button.classList.toggle("is-active", selected.length > 0);
        button.title = selected.length ? `Host service filters: ${label}` : "Filter hosts by open service";
        button.setAttribute("aria-label", button.title);
    }
    if (clearButton) {
        clearButton.disabled = selected.length === 0;
    }
    if (!list) {
        return;
    }
    const options = collectWorkspaceServiceOptions();
    list.innerHTML = "";
    if (!options.length) {
        const empty = document.createElement("p");
        empty.className = "meta-note";
        empty.textContent = "No open services available.";
        list.appendChild(empty);
        return;
    }
    options.forEach((service) => {
        const row = document.createElement("label");
        row.className = "panel-filter-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = service.service;
        checkbox.checked = selectedKeys.has(String(service.service || "").toLowerCase());
        checkbox.addEventListener("change", async () => {
            const next = selectedHostServiceFilters();
            const key = String(service.service || "").trim().toLowerCase();
            const hasService = next.some((item) => item.toLowerCase() === key);
            const filtered = checkbox.checked && !hasService
                ? next.concat([service.service])
                : next.filter((item) => item.toLowerCase() !== key);
            await setHostServiceFiltersAction(filtered);
        });
        const text = document.createElement("span");
        text.className = "panel-filter-option-name";
        text.textContent = service.service;
        row.appendChild(checkbox);
        row.appendChild(text);
        const count = document.createElement("span");
        const hostCount = Number(service.host_count || 0);
        count.className = "panel-filter-option-count";
        count.textContent = String(Number.isFinite(hostCount) ? hostCount : 0);
        row.appendChild(count);
        list.appendChild(row);
    });
}


export function setHostServiceFilterPopoverOpen(open) {
    const popover = document.getElementById("hosts-service-filter-popover");
    const button = document.getElementById("hosts-service-filter-button");
    const expanded = Boolean(open);
    if (popover) {
        popover.hidden = !expanded;
    }
    if (button) {
        button.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
    if (expanded) {
        syncHostServiceFilterOptions();
    }
}


export function currentHostFilterQuery() {
    const params = new URLSearchParams();
    const filter = String(workspaceState.hostFilter || "hide_down").trim().toLowerCase() === "show_all"
        ? "show_all"
        : "hide_down";
    params.set("filter", filter);
    selectedHostServiceFilters().forEach((service) => {
        params.append("service", service);
    });
    const category = String(workspaceState.hostCategoryFilter || "").trim();
    if (category) {
        params.set("category", category);
    }
    return params.toString();
}


export function currentServicesFilterQuery() {
    const params = new URLSearchParams();
    const hostId = parseInt(workspaceState.servicesHostFilterId, 10);
    if (Number.isFinite(hostId) && hostId > 0) {
        params.set("host_id", String(hostId));
    }
    const category = String(workspaceState.servicesCategoryFilter || "").trim();
    if (category) {
        params.set("category", category);
    }
    return params.toString();
}


export function syncHostFilterControls() {
    const showAll = document.getElementById("hosts-filter-show-all-button");
    const hideDown = document.getElementById("hosts-filter-hide-down-button");
    const resetButton = document.getElementById("hosts-reset-filter-button");
    const filter = String(workspaceState.hostFilter || "hide_down").trim().toLowerCase();
    const service = hostServiceFilterLabel();
    const category = String(workspaceState.hostCategoryFilter || "").trim();
    const servicesCategory = String(workspaceState.servicesCategoryFilter || "").trim();
    setValue("hosts-category-filter-select", category);
    setValue("services-category-filter-select", servicesCategory);
    const servicesHostFilterId = parseInt(workspaceState.servicesHostFilterId, 10);
    const servicesHostFilterLabel = String(workspaceState.servicesHostFilterLabel || "").trim();
    if (showAll) {
        showAll.classList.toggle("is-active", filter === "show_all");
    }
    if (hideDown) {
        hideDown.classList.toggle("is-active", filter !== "show_all");
    }
    if (resetButton) {
        const atDefault = filter === "hide_down" && !service && !category && (!Number.isFinite(servicesHostFilterId) || servicesHostFilterId <= 0);
        resetButton.disabled = atDefault;
        resetButton.classList.toggle("is-active", !atDefault);
        let label = "Reset host filters (show only up hosts)";
        if (service && category && servicesHostFilterLabel) {
            label = `Reset host filters (show only up hosts, clear service filter: ${service}, clear category filter: ${category}, clear services filter: ${servicesHostFilterLabel})`;
        } else if (service && servicesHostFilterLabel) {
            label = `Reset host filters (show only up hosts, clear service filter: ${service}, clear services filter: ${servicesHostFilterLabel})`;
        } else if (service && category) {
            label = `Reset host filters (show only up hosts, clear service filter: ${service}, clear category filter: ${category})`;
        } else if (service) {
            label = `Reset host filters (show only up hosts, clear service filter: ${service})`;
        } else if (category) {
            label = `Reset host filters (show only up hosts, clear category filter: ${category})`;
        } else if (servicesHostFilterLabel) {
            label = `Reset host filters (show only up hosts, clear services filter: ${servicesHostFilterLabel})`;
        }
        resetButton.setAttribute("title", label);
        resetButton.setAttribute("aria-label", label);
    }
}


export async function setHostFilterAction(filter) {
    workspaceState.hostFilter = String(filter || "hide_down").trim().toLowerCase() === "show_all"
        ? "show_all"
        : "hide_down";
    syncHostFilterControls();
    closeRibbonMenus();
    await loadWorkspaceHosts();
    await graphLoadSnapshot({background: false}).catch(() => {});
}


export async function setHostCategoryFilterAction(category) {
    workspaceState.hostCategoryFilter = String(category || "").trim();
    syncHostFilterControls();
    renderHosts(workspaceState.hosts);
    await Promise.all([
        loadWorkspaceHosts(),
        loadWorkspaceServices(),
    ]);
    await graphLoadSnapshot({background: false}).catch(() => {});
}


export async function setHostServiceFilterAction(service) {
    const value = String(service || "").trim();
    const selected = selectedHostServiceFilters();
    const selectedKeys = selected.map((item) => item.toLowerCase());
    if (value && selected.length === 1 && selectedKeys[0] === value.toLowerCase()) {
        await setHostServiceFiltersAction([]);
        return;
    }
    await setHostServiceFiltersAction(value ? [value] : []);
}


export async function setHostServiceFiltersAction(services) {
    workspaceState.hostServiceFilters = normalizeServiceFilterList(services);
    workspaceState.hostServiceFilter = workspaceState.hostServiceFilters.join(",");
    syncHostFilterControls();
    syncHostServiceFilterOptions();
    renderHosts(workspaceState.hosts);
    renderServices(workspaceState.services);
    await Promise.all([
        loadWorkspaceHosts(),
        loadWorkspaceServices(),
    ]);
    await graphLoadSnapshot({background: false}).catch(() => {});
}


export async function setServicesCategoryFilterAction(category) {
    workspaceState.servicesCategoryFilter = String(category || "").trim();
    syncHostFilterControls();
    renderServices(workspaceState.services);
    await loadWorkspaceServices();
}


export async function setServicesHostFilterAction(hostId, hostLabel = "") {
    const normalizedHostId = parseInt(hostId, 10);
    const currentHostId = parseInt(workspaceState.servicesHostFilterId, 10);
    if (Number.isFinite(normalizedHostId) && normalizedHostId > 0 && normalizedHostId === currentHostId) {
        setServicesHostScope(0);
    } else if (Number.isFinite(normalizedHostId) && normalizedHostId > 0) {
        workspaceState.selectedHostId = normalizedHostId;
        setServicesHostScope(normalizedHostId, hostLabel);
    } else {
        setServicesHostScope(0);
    }
    syncHostFilterControls();
    renderHosts(workspaceState.hosts);
    await Promise.all([
        workspaceState.selectedHostId ? loadHostDetail(workspaceState.selectedHostId) : Promise.resolve(),
        loadWorkspaceServices(),
    ]);
}


export async function resetHostFiltersAction() {
    workspaceState.hostFilter = "hide_down";
    workspaceState.hostServiceFilter = "";
    workspaceState.hostServiceFilters = [];
    workspaceState.hostCategoryFilter = "";
    workspaceState.servicesHostFilterId = 0;
    workspaceState.servicesHostFilterLabel = "";
    workspaceState.servicesCategoryFilter = "";
    syncHostFilterControls();
    renderHosts(workspaceState.hosts);
    renderServices(workspaceState.services);
    closeRibbonMenus();
    await Promise.all([
        loadWorkspaceHosts(),
        loadWorkspaceServices(),
    ]);
    await graphLoadSnapshot({background: false}).catch(() => {});
}
