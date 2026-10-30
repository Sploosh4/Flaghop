/** Workspace output format. */
import { escapeHtml } from "./dom.js";
import { ANSI_BG_CLASS_BY_CODE, ANSI_FG_CLASS_BY_CODE } from "./state.js";

export function resetAnsiState(state) {
    state.bold = false;
    state.fg = "";
    state.bg = "";
}


export function applyAnsiSgrCodes(codes, state) {
    const values = Array.isArray(codes) && codes.length ? codes : [0];
    for (let index = 0; index < values.length; index += 1) {
        const code = Number(values[index]);
        if (!Number.isFinite(code)) {
            continue;
        }
        if (code === 0) {
            resetAnsiState(state);
            continue;
        }
        if (code === 1) {
            state.bold = true;
            continue;
        }
        if (code === 22) {
            state.bold = false;
            continue;
        }
        if (code === 39) {
            state.fg = "";
            continue;
        }
        if (code === 49) {
            state.bg = "";
            continue;
        }
        if (ANSI_FG_CLASS_BY_CODE[code]) {
            state.fg = ANSI_FG_CLASS_BY_CODE[code];
            continue;
        }
        if (ANSI_BG_CLASS_BY_CODE[code]) {
            state.bg = ANSI_BG_CLASS_BY_CODE[code];
            continue;
        }
        if (code === 38 || code === 48 || code === 58) {
            const mode = Number(values[index + 1]);
            if (mode === 5) {
                index += 2;
            } else if (mode === 2) {
                index += 4;
            }
        }
    }
}


export function ansiClassesForState(state) {
    const classes = ["ansi-segment"];
    if (state.bold) {
        classes.push("ansi-bold");
    }
    if (state.fg) {
        classes.push(state.fg);
    }
    if (state.bg) {
        classes.push(state.bg);
    }
    return classes.join(" ");
}


export function ansiTextToHtml(text) {
    const raw = String(text || "").replace(/\r\n/g, "\n");
    const sgrPattern = /\u001b\[([0-9;]*)m/g;
    const state = {bold: false, fg: "", bg: ""};
    let cursor = 0;
    let html = "";

    raw.replace(sgrPattern, (match, params, offset) => {
        if (offset > cursor) {
            const chunk = raw.slice(cursor, offset);
            html += `<span class="${ansiClassesForState(state)}">${escapeHtml(chunk)}</span>`;
        }
        const codes = String(params || "")
            .split(";")
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
            .map((value) => parseInt(value, 10))
            .filter((value) => Number.isFinite(value));
        applyAnsiSgrCodes(codes, state);
        cursor = offset + match.length;
        return match;
    });

    if (cursor < raw.length) {
        html += `<span class="${ansiClassesForState(state)}">${escapeHtml(raw.slice(cursor))}</span>`;
    }

    return html || "";
}


export function renderAnsiOutput(nodeId, text) {
    const node = document.getElementById(nodeId);
    if (!node) {
        return;
    }
    const nearBottom = Math.abs((node.scrollTop + node.clientHeight) - node.scrollHeight) < 24;
    node.innerHTML = ansiTextToHtml(text || "");
    if (nearBottom) {
        node.scrollTop = node.scrollHeight;
    }
}


export function formatTargetLabel(host, port = "", protocol = "") {
    const hostText = String(host || "").trim();
    const portText = String(port || "").trim();
    const protocolText = String(protocol || "").trim();
    if (!portText && !protocolText) {
        return hostText;
    }
    if (!protocolText) {
        return `${hostText}:${portText}`;
    }
    if (!portText) {
        return hostText ? `${hostText}/${protocolText}` : `/${protocolText}`;
    }
    return `${hostText}:${portText}/${protocolText}`;
}


export function summarizeBannerText(raw, maxLen = 160) {
    const normalized = String(raw || "").replace(/\s+/g, " ").trim();
    if (!normalized) {
        return "";
    }
    if (normalized.length <= maxLen) {
        return normalized;
    }
    return `${normalized.slice(0, maxLen - 3)}...`;
}


export function extractBannerForPort(portRow) {
    const scripts = Array.isArray(portRow?.scripts) ? portRow.scripts : [];
    const priorityPredicates = [
        (scriptId) => scriptId === "banner",
        (scriptId) => scriptId.includes("banner"),
        (scriptId) => scriptId === "http-title",
        (scriptId) => scriptId === "dns-nsid",
    ];
    for (const predicate of priorityPredicates) {
        for (const script of scripts) {
            const scriptId = String(script?.script_id || "").trim().toLowerCase();
            if (!scriptId || !predicate(scriptId)) {
                continue;
            }
            const output = summarizeBannerText(script?.output || "");
            if (output) {
                return output;
            }
        }
    }
    const service = portRow?.service || {};
    const serviceBanner = summarizeBannerText(
        [service.product, service.version, service.extrainfo].filter(Boolean).join(" ")
    );
    return serviceBanner;
}


export function formatEtaSeconds(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return "";
    }
    const total = Math.max(0, Math.floor(parsed));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}


export function isProcessRunning(status) {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "running" || normalized === "waiting";
}


export function getProcessStatusClass(status) {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "running") {
        return "process-status-running";
    }
    if (normalized === "crashed") {
        return "process-status-crashed";
    }
    if (normalized === "problem") {
        return "process-status-problem";
    }
    return "";
}
