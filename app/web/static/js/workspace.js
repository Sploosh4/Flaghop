/* Presentation shell. Existing Legion controls and handlers remain the source of actions. */
(() => {
    "use strict";
    const byId = (id) => document.getElementById(id);
    const titles = {overview: "Overview", hosts: "Hosts", services: "Services", graph: "Graph", activity: "Activity", capture: "Credentials & relay", approvals: "Approvals"};
    const slots = {};
    let current = "overview";
    let lastFocus = null;
    let refreshQueued = false;
    const stored = (key, fallback) => {try {return localStorage.getItem(`legion.workspace.${key}`) || fallback;} catch (_) {return fallback;}};
    const remember = (key, value) => {try {localStorage.setItem(`legion.workspace.${key}`, value);} catch (_) { /* Private mode is usable without persistence. */ }};
    const proxy = (id) => { const button = byId(id); if (button && !button.disabled) button.click(); };

    function createSlot(name, className = "") {
        const section = document.createElement("section");
        section.className = `workspace-view ${className}`;
        section.dataset.workspaceView = name;
        section.setAttribute("aria-label", titles[name]);
        section.hidden = true;
        byId("workspace-views").appendChild(section);
        slots[name] = section;
        return section;
    }

    function selectView(name, persist = true) {
        if (!slots[name]) return;
        current = name;
        const detail = byId("workspace-host-detail-panel");
        if (name === "hosts" || name === "services") slots[name].appendChild(detail);
        Object.entries(slots).forEach(([key, node]) => {node.hidden = key !== name;});
        document.querySelectorAll("[data-view]").forEach((button) => {
            if (button.closest(".workspace-nav")) {
                if (button.dataset.view === name) button.setAttribute("aria-current", "page");
                else button.removeAttribute("aria-current");
            }
        });
        byId("breadcrumb-view").textContent = titles[name];
        document.body.dataset.workspaceView = name;
        if (name === "services" && typeof setServicesPanelCollapsed === "function") setServicesPanelCollapsed(false);
        if (name === "graph" && typeof graphWorkspaceEnabled === "function" && graphWorkspaceEnabled()) {
            if (typeof setGraphPanelCollapsed === "function") setGraphPanelCollapsed(false);
            if (typeof graphRenderWorkspace === "function") requestAnimationFrame(() => graphRenderWorkspace({preserveDetail: true}));
        }
        if (persist) remember("view", name);
        refreshMirrors();
    }

    function emptyMessage(id, title, text, action) {
        const box = document.createElement("div");
        box.id = id;
        box.className = "workspace-empty";
        const heading = document.createElement("h3"); heading.textContent = title;
        const paragraph = document.createElement("p"); paragraph.textContent = text;
        box.append(heading, paragraph);
        if (action) {
            const button = document.createElement("button"); button.type = "button";
            button.textContent = action.label; button.dataset.proxy = action.target;
            box.appendChild(button);
        }
        return box;
    }

    function syncText(id, text) {const node = byId(id); if (node && node.textContent !== text) node.textContent = text;}
    function refreshMirrors() {
        document.querySelectorAll("[data-mirror]").forEach((node) => {
            const value = byId(node.dataset.mirror)?.textContent?.trim() || "0";
            if (node.textContent !== value) node.textContent = value;
        });
        const raw = byId("project-name")?.textContent?.trim() || "";
        const temporary = byId("project-kind")?.textContent?.trim() === "temporary";
        const name = byId("project-name")?.dataset.displayName || (temporary ? "Untitled workspace" : raw.split(/[\\/]/).pop().replace(/\.legion$/, "") || "Workspace");
        syncText("sidebar-project-name", name);
        syncText("breadcrumb-project", name);
        syncText("sidebar-project-kind", temporary ? "Temporary · save to keep your work" : "Saved project");
        const running = Number(byId("stat-running")?.textContent || 0);
        syncText("statusbar-running", running ? `${running} running ${running === 1 ? "job" : "jobs"}` : "No running jobs");
        const action = byId("action-status")?.textContent?.trim() || "Ready";
        syncText("statusbar-action", action === "Idle" ? "Ready" : action);
        const hosts = Number(byId("stat-hosts")?.textContent || 0);
        byId("welcome-no-hosts").hidden = hosts > 0;
        byId("welcome-has-hosts").hidden = hosts === 0;
        const detailName = byId("host-detail-name")?.textContent?.trim();
        byId("workspace-detail-empty").hidden = Boolean(detailName);
        byId("workspace-host-detail-panel").classList.toggle("is-empty-detail", !detailName);
        const graph = byId("graph-workspace-panel");
        const graphDisabled = graph.dataset.graphEnabled !== "true";
        byId("graph-disabled-message").hidden = !graphDisabled;
        const capture = byId("credential-capture-panel");
        byId("capture-disabled-message").hidden = !capture.hidden;
    }

    function queueMirrors() {
        if (refreshQueued) return;
        refreshQueued = true;
        requestAnimationFrame(() => { refreshQueued = false; refreshMirrors(); });
    }

    function setSidebarCollapsed(collapsed) {
        document.body.classList.toggle("sidebar-collapsed", collapsed);
        byId("sidebar-toggle").setAttribute("aria-expanded", String(!collapsed));
        remember("sidebarCollapsed", String(collapsed));
    }

    function bindResize(id, variable, min, max, storageKey, initial) {
        const grip = byId(id);
        const parsed = Number(stored(storageKey, initial));
        const saved = Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : initial;
        const setWidth = (width) => {
            const value = Math.round(Math.max(min, Math.min(max, width)));
            document.documentElement.style.setProperty(variable, `${value}px`);
            grip.setAttribute("aria-valuenow", String(value));
            remember(storageKey, String(value));
        };
        setWidth(saved);
        grip.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;
            grip.setPointerCapture(event.pointerId);
            const start = event.clientX;
            const width = Number(grip.getAttribute("aria-valuenow"));
            document.body.classList.add("workspace-resizing");
            const move = (e) => setWidth(width + e.clientX - start);
            const finish = () => {
                grip.removeEventListener("pointermove", move);
                document.body.classList.remove("workspace-resizing");
            };
            grip.addEventListener("pointermove", move);
            grip.addEventListener("pointerup", finish, {once: true});
            grip.addEventListener("pointercancel", finish, {once: true});
        });
        grip.addEventListener("keydown", (event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const width = Number(grip.getAttribute("aria-valuenow"));
            setWidth(event.key === "Home" ? min : event.key === "End" ? max : width + (event.key === "ArrowLeft" ? -10 : 10));
        });
    }

    function closeSearch() {
        byId("workspace-search").hidden = true;
        lastFocus?.focus();
    }
    function renderSearch() {
        const query = byId("workspace-search-input").value.trim().toLowerCase();
        const results = byId("workspace-search-results"); results.replaceChildren();
        const entries = Object.entries(titles).map(([view, label]) => ({label, detail: "View", run: () => selectView(view)}));
        document.querySelectorAll("#workspace-commandbar .ribbon-submenu-item").forEach((node) => {
            entries.push({label: node.textContent.trim(), detail: "Action", run: () => proxy(node.id)});
        });
        document.querySelectorAll("#hosts-body tr").forEach((row) => {
            entries.push({label: row.textContent.trim().replace(/\s+/g, " "), detail: "Host", run: () => {selectView("hosts"); row.click();}});
        });
        const matches = entries.filter((entry) => !query || entry.label.toLowerCase().includes(query)).slice(0, 20);
        matches.forEach((entry) => {
            const button = document.createElement("button"); button.type = "button";
            const text = document.createElement("span"); text.textContent = entry.label;
            const hint = document.createElement("small"); hint.textContent = entry.detail;
            button.append(text, hint);
            button.addEventListener("click", () => {closeSearch(); entry.run();});
            results.appendChild(button);
        });
        if (!matches.length) results.textContent = "No matching views, actions, or hosts.";
    }
    function openSearch() {
        lastFocus = document.activeElement;
        byId("workspace-search").hidden = false;
        byId("workspace-search-input").value = "";
        renderSearch(); byId("workspace-search-input").focus();
    }

    function setupWorkspaceActions() {
        const project = document.querySelector(".workspace-project");
        const projectShell = document.createElement("div");
        projectShell.className = "workspace-project-shell";
        project.before(projectShell); projectShell.appendChild(project);
        const oldTitle = byId("breadcrumb-project");
        const title = document.createElement("button");
        title.id = oldTitle.id; title.type = "button"; title.textContent = oldTitle.textContent;
        title.title = "Rename workspace"; title.setAttribute("aria-label", "Rename workspace");
        oldTitle.replaceWith(title);
        const editor = document.createElement("input");
        editor.id = "workspace-rename-input"; editor.type = "text"; editor.maxLength = 120;
        editor.setAttribute("aria-label", "Workspace name"); editor.hidden = true;
        title.after(editor);
        const error = document.createElement("span");
        error.className = "workspace-rename-error"; error.setAttribute("role", "alert");
        editor.after(error);
        let editing = null;
        const finish = () => {
            editing = null; editor.hidden = true; editor.disabled = false; title.hidden = false;
            project.classList.remove("is-renaming");
            error.textContent = ""; editor.removeAttribute("aria-invalid");
        };
        const begin = (location = "title") => {
            closeMenu();
            if (editing?.saving) return;
            editing = {path: byId("project-name").textContent.trim(), name: title.textContent, location};
            const sidebar = location === "sidebar";
            editor.classList.toggle("workspace-rename-sidebar", sidebar);
            error.classList.toggle("workspace-rename-sidebar-error", sidebar);
            project.classList.toggle("is-renaming", sidebar);
            if (sidebar) projectShell.append(editor, error);
            else {title.after(editor); editor.after(error);}
            editor.value = editing.name; title.hidden = !sidebar; editor.hidden = false;
            error.textContent = ""; editor.removeAttribute("aria-invalid");
            editor.focus(); editor.select();
        };
        const save = async () => {
            if (!editing || editing.saving) return;
            const name = editor.value.trim();
            if (name === editing.name) {finish(); return;}
            if (!name) {
                error.textContent = "Enter a workspace name."; editor.setAttribute("aria-invalid", "true");
                editor.focus(); return;
            }
            editing.saving = true; editor.disabled = true;
            try {
                const response = await postJson("/api/project/rename", {name, expected_path: editing.path});
                if (byId("project-name").textContent.trim() === editing.path) renderProject(response.project);
                finish(); refreshMirrors();
                setActionStatus("Workspace renamed");
            } catch (failure) {
                editing.saving = false; editor.disabled = false;
                error.textContent = failure.message; editor.setAttribute("aria-invalid", "true"); editor.focus();
            }
        };
        title.addEventListener("click", () => begin("title"));
        editor.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {event.preventDefault(); save();}
            if (event.key === "Escape" && !editing?.saving) {
                event.preventDefault(); const anchor = editing?.location === "sidebar" ? project : title;
                finish(); anchor.focus();
            }
        });
        editor.addEventListener("blur", () => {if (editing && !editing.saving) save();});
        const menu = document.createElement("div");
        menu.id = "workspace-context-menu"; menu.className = "workspace-context-menu";
        menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", "Workspace actions"); menu.hidden = true;
        document.body.appendChild(menu);
        project.setAttribute("aria-haspopup", "menu"); project.setAttribute("aria-expanded", "false");
        function closeMenu(restoreFocus = false) {
            menu.hidden = true; project.setAttribute("aria-expanded", "false");
            if (restoreFocus) project.focus();
        }
        const options = [
            ["Rename workspace…", () => begin("sidebar")],
            ["Save workspace", () => proxy("ribbon-workspace-save-action-button")],
            ["Save workspace as…", () => proxy("ribbon-workspace-save-as-action-button")],
            ["Export workspace ZIP", () => proxy("ribbon-workspace-download-action-button")],
            ["Workspace details", () => {if (byId("workspace-context").hidden) byId("workspace-context-toggle").click();}],
        ];
        options.forEach(([label, action]) => {
            const button = document.createElement("button"); button.type = "button"; button.textContent = label;
            button.setAttribute("role", "menuitem");
            button.addEventListener("click", () => {closeMenu(); action();}); menu.appendChild(button);
        });
        function openMenu(x, y) {
            menu.hidden = false; project.setAttribute("aria-expanded", "true");
            menu.style.left = `${Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8))}px`;
            menu.style.top = `${Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8))}px`;
            menu.querySelector("button").focus();
        }
        project.addEventListener("contextmenu", (event) => {event.preventDefault(); openMenu(event.clientX, event.clientY);});
        project.addEventListener("keydown", (event) => {
            if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
                event.preventDefault(); const rect = project.getBoundingClientRect(); openMenu(rect.left, rect.bottom);
            }
        });
        menu.addEventListener("keydown", (event) => {
            const buttons = [...menu.querySelectorAll("button")]; const index = buttons.indexOf(document.activeElement);
            if (event.key === "Escape") {event.preventDefault(); closeMenu(true);}
            if (event.key === "Tab") closeMenu();
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
                buttons[next].focus();
            }
        });
        document.addEventListener("pointerdown", (event) => {if (!menu.contains(event.target)) closeMenu();});
        window.addEventListener("resize", () => closeMenu());
        window.addEventListener("blur", () => closeMenu());
    }

    function setupGraphZoom() {
        const panel = document.querySelector(".graph-canvas-panel");
        const controls = document.createElement("div"); controls.className = "workspace-graph-zoom";
        controls.setAttribute("role", "group"); controls.setAttribute("aria-label", "Graph zoom");
        const slider = byId("graph-zoom-slider");
        const change = (value) => {slider.value = String(value); slider.dispatchEvent(new Event("input", {bubbles: true}));};
        [["−", "Zoom graph out", () => change(Number(slider.value) - 10)],
         ["100%", "Reset graph zoom", () => change(100)],
         ["+", "Zoom graph in", () => change(Number(slider.value) + 10)]].forEach(([label, description, action], index) => {
            const button = document.createElement("button"); button.type = "button"; button.textContent = label;
            button.setAttribute("aria-label", description); button.title = description;
            if (index === 1) button.id = "workspace-graph-zoom-value";
            button.addEventListener("click", action); controls.appendChild(button);
        });
        const sync = () => {
            controls.hidden = byId("graph-workspace-canvas").hidden;
            byId("workspace-graph-zoom-value").textContent = `${slider.value}%`;
            controls.firstElementChild.disabled = Number(slider.value) <= Number(slider.min);
            controls.lastElementChild.disabled = Number(slider.value) >= Number(slider.max);
        };
        panel.appendChild(controls); slider.addEventListener("input", sync); sync();
        new MutationObserver(sync).observe(byId("graph-workspace-canvas"), {attributes: true, attributeFilter: ["hidden"]});
    }

    window.addEventListener("DOMContentLoaded", () => {
        // A running backend can still serve its cached upstream template. Normalize
        // its duplicate graph shell ID without interrupting any background jobs.
        const graphShells = document.querySelectorAll("#graph-workspace-shell");
        if (graphShells.length > 1) graphShells[0].id = "graph-panel-layout";
        const main = byId("workspace-views");
        const ribbon = main.querySelector(".ribbon-panel");
        const commands = ribbon.querySelector(".ribbon-menu-group");
        byId("workspace-commandbar").appendChild(commands);
        byId("workspace-commandbar").appendChild(ribbon.querySelector(".ribbon-summary-group"));
        const context = byId("workspace-context");
        context.appendChild(ribbon.querySelector(".ribbon-project-group"));
        setupWorkspaceActions(); setupGraphZoom();
        const rationale = ribbon.querySelector(".ribbon-rationale-group");
        const processes = ribbon.querySelector(".ribbon-process-group");
        const overview = createSlot("overview", "overview-view");
        overview.innerHTML = `<div class="welcome-workspace"><span class="welcome-mark" aria-hidden="true">L</span><div id="welcome-no-hosts"><h1>What would you like to investigate?</h1><p>A clear view of your hosts, services, and evidence.</p></div><div id="welcome-has-hosts" hidden><h1>Your workspace, connected.</h1><p>Pick up an investigation or bring in new results.</p></div><div class="welcome-action-card"><span class="welcome-card-label">Start with a target. Build the picture.</span><div class="welcome-actions"><button type="button" class="primary-action" data-proxy="ribbon-scan-add-action-button"><i class="fa-solid fa-plus" aria-hidden="true"></i> New scan</button><button type="button" data-proxy="ribbon-import-xml-action-button">Import Nmap XML</button><button type="button" data-proxy="ribbon-workspace-open-action-button">Open workspace</button></div></div><div class="welcome-shortcuts"><span><kbd>Ctrl K</kbd> Search views and actions</span><span>Results and evidence stay in your workspace</span></div></div>`;
        createSlot("hosts", "inspection-view").appendChild(byId("workspace-hosts-panel"));
        createSlot("services", "inspection-view").appendChild(byId("workspace-services-panel"));
        const detail = byId("workspace-host-detail-panel");
        const emptyDetail = emptyMessage("workspace-detail-empty", "Select a host to inspect", "Ports, scripts, screenshots, and notes will appear here.");
        detail.insertBefore(emptyDetail, detail.children[1]);
        slots.hosts.appendChild(detail);
        const graphSlot = createSlot("graph", "graph-view");
        graphSlot.appendChild(byId("graph-workspace-panel"));
        graphSlot.appendChild(emptyMessage("graph-disabled-message", "Graph workspace is disabled", "Enable Graph Workspace in Interface settings to explore relationships and evidence.", {label: "Interface settings", target: "ribbon-interface-settings-button"}));
        const activity = createSlot("activity", "activity-view"); activity.append(processes, rationale);
        const capture = createSlot("capture", "capture-view"); capture.appendChild(byId("credential-capture-panel"));
        capture.appendChild(emptyMessage("capture-disabled-message", "Credential workspace is hidden", "Show the existing credential and relay workspace to access its controls.", {label: "Show workspace", target: "ribbon-credential-capture-toggle-button"}));
        createSlot("approvals", "approvals-view").appendChild(byId("workspace-approvals-panel"));
        // All functional children have been reparented. Keep the empty wrapper for legacy queries.
        ribbon.hidden = true;
        const splitter = document.createElement("div");
        splitter.id = "inspection-resizer"; splitter.className = "inspection-resizer";
        splitter.tabIndex = 0; splitter.setAttribute("role", "separator");
        splitter.setAttribute("aria-label", "Resize host list"); splitter.setAttribute("aria-orientation", "vertical");
        splitter.setAttribute("aria-valuemin", "320"); splitter.setAttribute("aria-valuemax", "900");
        slots.hosts.insertBefore(splitter, detail);
        bindResize("sidebar-resizer", "--sidebar-width", 210, 340, "sidebarWidth", 250);
        bindResize("inspection-resizer", "--list-width", 320, 900, "listWidth", 540);
        byId("sidebar-toggle").addEventListener("click", () => setSidebarCollapsed(true));
        byId("sidebar-reopen").addEventListener("click", () => setSidebarCollapsed(false));
        setSidebarCollapsed(stored("sidebarCollapsed", "false") === "true");
        byId("workspace-context-toggle").addEventListener("click", () => {
            context.hidden = !context.hidden;
            byId("workspace-context-toggle").setAttribute("aria-expanded", String(!context.hidden));
        });
        document.addEventListener("click", (event) => {
            const nav = event.target.closest("[data-view]");
            if (nav) selectView(nav.dataset.view);
            const button = event.target.closest("[data-proxy]");
            if (button) proxy(button.dataset.proxy);
        });
        byId("workspace-search-button").addEventListener("click", openSearch);
        // These original filter controls reveal the related table, now in its own
        // view. Capture sees the host control before its handler stops bubbling.
        document.addEventListener("click", (event) => {
            if (event.target.closest(".host-filter-cell button")) selectView("services");
            else if (event.target.closest(".service-filter-cell button")) selectView("hosts");
        }, true);
        byId("workspace-search-close").addEventListener("click", closeSearch);
        byId("workspace-search-input").addEventListener("input", renderSearch);
        byId("workspace-search").addEventListener("click", (event) => {if (event.target === byId("workspace-search")) closeSearch();});
        byId("workspace-search").addEventListener("keydown", (event) => {
            if (event.key === "Escape") {event.preventDefault(); closeSearch();}
            if (event.key === "ArrowDown") {
                event.preventDefault();
                const buttons = [...byId("workspace-search-results").querySelectorAll("button")];
                buttons[(buttons.indexOf(document.activeElement) + 1) % buttons.length]?.focus();
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                const buttons = [...byId("workspace-search-results").querySelectorAll("button")];
                buttons[(buttons.indexOf(document.activeElement) - 1 + buttons.length) % buttons.length]?.focus();
            }
            if (event.key === "Enter" && document.activeElement === byId("workspace-search-input")) {
                event.preventDefault(); byId("workspace-search-results").querySelector("button")?.click();
            }
            if (event.key === "Tab") {
                const focusable = [...byId("workspace-search").querySelectorAll("button, input")];
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
                if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
            }
        });
        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {event.preventDefault(); openSearch();}
        });
        // Observe data-bearing controls only, rather than the mirrors themselves.
        const observer = new MutationObserver(queueMirrors);
        ["project-name", "project-kind", "stat-hosts", "stat-open-ports", "stat-services", "stat-running", "approval-count", "action-status", "host-detail-name"].forEach((id) => {
            const node = byId(id); if (node) observer.observe(node, {childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["data-display-name"]});
        });
        ["graph-workspace-panel", "credential-capture-panel"].forEach((id) => observer.observe(byId(id), {attributes: true, attributeFilter: ["hidden", "data-graph-enabled"]}));
        selectView(stored("view", "overview"), false);
    });
})();
