
/** Called by WorkspaceController before UI handlers or asynchronous updates start. */
let applySchedulerPreferences;
export function connectScan(callbacks) {
    for (const name of ["applySchedulerPreferences"]) {
        if (typeof callbacks[name] !== "function") throw new TypeError(`Missing scan callback: ${name}`);
    }
    ({ applySchedulerPreferences } = callbacks);
}

import { closeNmapScanModalAction } from "./dialogs.js";
import { getChecked, getValue, setActionStatus, setChecked, setValue } from "./dom.js";
import { legacyGoalProfileFromEngagementPolicy } from "./engagement_policy.js";
import { postJson } from "./http.js";
import { pollSnapshot } from "./live_updates.js";
import { buildEngagementPolicyForPresetSelection, getSelectedNmapEngagementPreset, getSelectedPassiveCaptureDuration, isInternalEngagementPresetSelection, isInternalQuickReconPreset } from "./scan_policy.js";
import { INTERNAL_QUICK_RECON_TCP_PORTS, RFC1918_COMPREHENSIVE_TCP_PORTS, nmapWizardState } from "./state.js";
/** Workspace scan. */

export function parseTargets(text) {
    return (text || "")
        .split(/[\s,]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0);
}


export function getSelectedNmapMode() {
    const node = document.querySelector("input[name='nmap-scan-mode']:checked");
    return node ? String(node.value || "rfc1918_discovery") : "rfc1918_discovery";
}


export function normalizeTiming(value, fallback = "T3") {
    const text = String(value || fallback).toUpperCase();
    const normalized = text.startsWith("T") ? text : `T${text}`;
    if (["T0", "T1", "T2", "T3", "T4", "T5"].includes(normalized)) {
        return normalized;
    }
    return fallback;
}


export function normalizePortCount(value, fallback = 1000) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(65535, Math.max(1, parsed));
}


export function collectNmapWizardTargets() {
    const mode = getSelectedNmapMode();
    const dedup = new Set();
    if (mode !== "rfc1918_discovery") {
        parseTargets(getValue("nmap-targets")).forEach((target) => dedup.add(target));
        return Array.from(dedup);
    }

    if (getChecked("nmap-rfc-10")) {
        dedup.add("10.0.0.0/8");
    }
    if (getChecked("nmap-rfc-172")) {
        dedup.add("172.16.0.0/12");
    }
    if (getChecked("nmap-rfc-192")) {
        dedup.add("192.168.0.0/16");
    }
    return Array.from(dedup);
}


export function getSelectedRfcScanProfile() {
    const node = document.getElementById("nmap-rfc-profile");
    const value = node ? String(node.value || "quick").trim().toLowerCase() : "quick";
    return value === "comprehensive" ? "comprehensive" : "quick";
}


export function getRfcExplicitPortsForProfile(profile) {
    return profile === "comprehensive" ? RFC1918_COMPREHENSIVE_TCP_PORTS : INTERNAL_QUICK_RECON_TCP_PORTS;
}


export function getSelectedRfcChunkConcurrency() {
    const node = document.getElementById("nmap-rfc-chunk-concurrency");
    const parsed = parseInt(node ? String(node.value || "1").trim() : "1", 10);
    if (!Number.isFinite(parsed)) {
        return 1;
    }
    return Math.max(1, Math.min(parsed, 4));
}


export function getNmapScanOptions(mode) {
    if (mode === "easy") {
        const quickReconPreset = isInternalQuickReconPreset(getSelectedNmapEngagementPreset());
        return {
            discovery: getChecked("nmap-easy-discovery"),
            skip_dns: getChecked("nmap-easy-skip-dns"),
            force_pn: getChecked("nmap-easy-force-pn"),
            timing: normalizeTiming(getValue("nmap-easy-timing"), "T3"),
            top_ports: quickReconPreset ? 0 : normalizePortCount(getValue("nmap-easy-top-ports"), 1000),
            explicit_ports: quickReconPreset ? INTERNAL_QUICK_RECON_TCP_PORTS : "",
            service_detection: getChecked("nmap-easy-service-detection"),
            default_scripts: getChecked("nmap-easy-default-scripts"),
            os_detection: getChecked("nmap-easy-os-detection"),
            aggressive: false,
            full_ports: false,
            vuln_scripts: false,
            host_discovery_only: false,
            arp_ping: false,
        };
    }

    if (mode === "hard") {
        return {
            discovery: getChecked("nmap-hard-discovery"),
            skip_dns: getChecked("nmap-hard-skip-dns"),
            force_pn: getChecked("nmap-hard-force-pn"),
            timing: normalizeTiming(getValue("nmap-hard-timing"), "T4"),
            top_ports: normalizePortCount(getValue("nmap-hard-top-ports"), 1000),
            service_detection: getChecked("nmap-hard-service-detection"),
            default_scripts: getChecked("nmap-hard-default-scripts"),
            os_detection: getChecked("nmap-hard-os-detection"),
            aggressive: getChecked("nmap-hard-aggressive"),
            full_ports: getChecked("nmap-hard-full-ports"),
            vuln_scripts: getChecked("nmap-hard-vuln-scripts"),
            host_discovery_only: false,
            arp_ping: false,
        };
    }

    const hostDiscoveryOnly = getChecked("nmap-rfc-host-discovery-only");
    const rfcProfile = getSelectedRfcScanProfile();
    return {
        discovery: getChecked("nmap-rfc-discovery"),
        host_discovery_only: hostDiscoveryOnly,
        skip_dns: getChecked("nmap-rfc-skip-dns"),
        arp_ping: getChecked("nmap-rfc-arp-ping"),
        force_pn: false,
        timing: normalizeTiming(getValue("nmap-rfc-timing"), "T3"),
        top_ports: 0,
        explicit_ports: hostDiscoveryOnly ? "" : getRfcExplicitPortsForProfile(rfcProfile),
        scan_profile: rfcProfile,
        chunk_concurrency: getSelectedRfcChunkConcurrency(),
        service_detection: getChecked("nmap-rfc-service-detection"),
        default_scripts: getChecked("nmap-rfc-default-scripts"),
        os_detection: getChecked("nmap-rfc-os-detection"),
        aggressive: false,
        full_ports: false,
        vuln_scripts: false,
    };
}


export function getSelectedRfcSubnetCount() {
    const selected = [getChecked("nmap-rfc-10"), getChecked("nmap-rfc-172"), getChecked("nmap-rfc-192")];
    return selected.filter(Boolean).length;
}


export function setRfcTargetControlsEnabled(enabled) {
    ["nmap-rfc-10", "nmap-rfc-172", "nmap-rfc-192"].forEach((id) => {
        const node = document.getElementById(id);
        if (node) {
            node.disabled = !enabled;
        }
    });
}


export function applyNmapModeTargetDefaults(mode) {
    if (mode === "rfc1918_discovery") {
        setChecked("nmap-rfc-discovery", true);
        setChecked("nmap-rfc-host-discovery-only", true);
        setChecked("nmap-rfc-arp-ping", false);
        setChecked("nmap-rfc-skip-dns", true);
        setValue("nmap-rfc-timing", "T3");
        setValue("nmap-rfc-profile", "quick");
        setValue("nmap-rfc-chunk-concurrency", "1");
        setChecked("nmap-rfc-service-detection", false);
        setChecked("nmap-rfc-default-scripts", false);
        setChecked("nmap-rfc-os-detection", false);
        setChecked("nmap-rfc-force-pn", false);
        setChecked("nmap-rfc-10", true);
        setChecked("nmap-rfc-172", true);
        setChecked("nmap-rfc-192", true);
        setRfcTargetControlsEnabled(true);
        return;
    }
    setChecked("nmap-rfc-10", false);
    setChecked("nmap-rfc-172", false);
    setChecked("nmap-rfc-192", false);
    setChecked("nmap-rfc-force-pn", false);
    setRfcTargetControlsEnabled(false);
}


export function isValidTopPortsValue(inputId) {
    const node = document.getElementById(inputId);
    if (!node || node.disabled) {
        return true;
    }
    const raw = String(node.value || "").trim();
    if (!raw) {
        return false;
    }
    const parsed = parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535;
}


export function validateNmapWizardState() {
    const mode = getSelectedNmapMode();
    if (mode === "passive_capture") {
        if (!isInternalEngagementPresetSelection(getSelectedNmapEngagementPreset())) {
            return {valid: false, reason: "Passive Capture is available only for internal engagement presets."};
        }
        if (!String(getValue("passive-capture-interface") || "").trim()) {
            return {valid: false, reason: "Select a capture interface."};
        }
        const duration = getSelectedPassiveCaptureDuration();
        if (![5, 15, 30, 45, 60, 75, 90, 105, 120].includes(duration)) {
            return {valid: false, reason: "Select a valid capture duration."};
        }
        return {valid: true, reason: ""};
    }
    const explicitTargets = mode === "rfc1918_discovery" ? [] : parseTargets(getValue("nmap-targets"));
    const hasExplicitTargets = explicitTargets.length > 0;
    const hasRfcRanges = mode === "rfc1918_discovery" && getSelectedRfcSubnetCount() > 0;
    if (!hasExplicitTargets && !hasRfcRanges) {
        return {valid: false, reason: "Add targets, or select RFC1918 ranges in RFC1918 mode."};
    }

    const targets = collectNmapWizardTargets();
    if (!targets.length) {
        return {valid: false, reason: "Provide at least one target."};
    }

    if (mode === "easy") {
        if (!isInternalQuickReconPreset(getSelectedNmapEngagementPreset()) && !isValidTopPortsValue("nmap-easy-top-ports")) {
            return {valid: false, reason: "Easy mode Top Ports must be 1-65535."};
        }
        return {valid: true, reason: ""};
    }

    if (mode === "hard") {
        const fullPorts = getChecked("nmap-hard-full-ports");
        if (!fullPorts && !isValidTopPortsValue("nmap-hard-top-ports")) {
            return {valid: false, reason: "Hard mode Top Ports must be 1-65535 when full scan is disabled."};
        }
        return {valid: true, reason: ""};
    }

    return {valid: true, reason: ""};
}


export function refreshNmapScanButtonState() {
    const button = document.getElementById("nmap-scan-button");
    if (!button) {
        return;
    }
    const verdict = validateNmapWizardState();
    const unlocked = !nmapWizardState.postSubmitLock;
    button.disabled = !verdict.valid || !unlocked;
    if (!unlocked) {
        button.title = "Enter scan inputs to enable this action.";
    } else {
        button.title = verdict.valid ? "" : verdict.reason;
    }
}


export function parseShellArgs(text) {
    const value = String(text || "").trim();
    if (!value) {
        return [];
    }
    const matches = value.match(/(?:[^\s"'`]+|"[^"]*"|'[^']*')+/g) || [];
    return matches
        .map((token) => token.trim())
        .map((token) => token.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
        .filter((token) => token.length > 0);
}


export function joinShellTokens(tokens) {
    return (tokens || [])
        .map((token) => {
            const text = String(token ?? "");
            if (!text) {
                return "''";
            }
            if (/^[A-Za-z0-9_./:=@-]+$/.test(text)) {
                return text;
            }
            return `'${text.replace(/'/g, "'\\''")}'`;
        })
        .join(" ");
}


export function updateNmapCommandPreview() {
    const previewNode = document.getElementById("nmap-command-preview");
    if (!previewNode) {
        return;
    }
    const mode = getSelectedNmapMode();
    const scanButton = document.getElementById("nmap-scan-button");
    const runActionsLabel = document.getElementById("nmap-run-actions-label");
    const argsLabel = document.getElementById("nmap-args-label");
    if (scanButton) {
        scanButton.textContent = mode === "passive_capture" ? "Start Passive Capture Job" : "Start Nmap Scan Job";
    }
    if (runActionsLabel) {
        runActionsLabel.lastChild.textContent = mode === "passive_capture"
            ? " Run scripted actions after spawned Easy scans"
            : " Run scripted actions after scan";
    }
    if (argsLabel) {
        argsLabel.hidden = mode === "passive_capture";
    }
    if (mode === "passive_capture") {
        const iface = String(getValue("passive-capture-interface") || "<interface>").trim() || "<interface>";
        const duration = getSelectedPassiveCaptureDuration();
        const seconds = duration * 60;
        const cmd = joinShellTokens([
            "tshark",
            "-i",
            iface,
            "-n",
            "-q",
            "-a",
            `duration:${seconds}`,
            "-f",
            "arp or broadcast or multicast or udp port 67 or udp port 68 or udp port 137 or udp port 138 or udp port 5353 or udp port 5355 or udp port 1900",
            "-w",
            "<output_prefix>.pcapng",
        ]);
        previewNode.textContent = `Command Preview: ${cmd}  |  Then queue Easy scans for discovered internal networks`;
        refreshNmapScanButtonState();
        return;
    }
    const targets = collectNmapWizardTargets();
    const options = getNmapScanOptions(mode);
    const nmapPath = "nmap";
    const extraArgs = getValue("nmap-args").trim();
    const extraTokens = parseShellArgs(extraArgs);
    const hasStatsEvery = extraTokens.some((token) => {
        const value = String(token || "").trim().toLowerCase();
        return value === "--stats-every" || value.startsWith("--stats-every=");
    });
    const hasVerbose = extraTokens.some((token) => {
        const value = String(token || "").trim().toLowerCase();
        return value === "-v" || value === "-vv" || value === "-vvv" || value === "--verbose";
    });
    const targetTokens = targets.length ? targets : ["<targets>"];
    const cmd = [nmapPath];

    if (options.host_discovery_only) {
        cmd.push("-sn");
        if (options.skip_dns) {
            cmd.push("-n");
        }
        if (options.arp_ping) {
            cmd.push("-PR");
        }
        cmd.push(`-${normalizeTiming(options.timing, "T3")}`);
    } else {
        if (options.force_pn || !options.discovery) {
            cmd.push("-Pn");
        }
        if (options.skip_dns) {
            cmd.push("-n");
        }
        cmd.push(`-${normalizeTiming(options.timing, "T3")}`);

        if (options.full_ports) {
            cmd.push("-p-");
        } else if (String(options.explicit_ports || "").trim()) {
            cmd.push("-p", String(options.explicit_ports || "").trim());
        } else {
            cmd.push("--top-ports", String(normalizePortCount(options.top_ports, 1000)));
        }

        if (options.aggressive) {
            cmd.push("-A");
        } else {
            if (options.service_detection) {
                cmd.push("-sV");
            }
            if (options.default_scripts) {
                cmd.push("-sC");
            }
            if (options.os_detection) {
                cmd.push("-O");
            }
        }

        if (options.vuln_scripts) {
            cmd.push("--script", "vuln");
        }
    }
    let finalExtraTokens = hasStatsEvery ? extraTokens : [...extraTokens, "--stats-every", "15s"];
    if (!hasVerbose) {
        finalExtraTokens = [...finalExtraTokens, "-vv"];
    }
    cmd.push(...finalExtraTokens, ...targetTokens, "-oA", "<output_prefix>");

    previewNode.textContent = `Command Preview: ${joinShellTokens(cmd)}`;
    refreshNmapScanButtonState();
}


export function syncNmapPresetDerivedOptions() {
    const preset = getSelectedNmapEngagementPreset();
    const quickReconPreset = isInternalQuickReconPreset(preset);
    const presetChanged = preset !== nmapWizardState.lastEngagementPreset;
    const topPortsNode = document.getElementById("nmap-easy-top-ports");
    const topPortsLabel = document.getElementById("nmap-easy-top-ports-label");
    const noteNode = document.getElementById("nmap-easy-preset-note");
    const serviceDetectionNode = document.getElementById("nmap-easy-service-detection");
    const defaultScriptsNode = document.getElementById("nmap-easy-default-scripts");

    if (presetChanged) {
        if (serviceDetectionNode) {
            serviceDetectionNode.checked = !quickReconPreset;
        }
        if (defaultScriptsNode) {
            defaultScriptsNode.checked = !quickReconPreset;
        }
    }

    if (topPortsNode) {
        topPortsNode.disabled = quickReconPreset;
    }
    if (topPortsLabel) {
        topPortsLabel.hidden = quickReconPreset;
    }
    if (noteNode) {
        noteNode.hidden = !quickReconPreset;
        noteNode.textContent = quickReconPreset
            ? `Internal Quick Recon uses a curated TCP port list instead of Top Ports: ${INTERNAL_QUICK_RECON_TCP_PORTS}. Add UDP-specific follow-up separately if needed.`
            : "";
    }
    nmapWizardState.lastEngagementPreset = preset;
}


export function setNmapWizardStep(step) {
    const nextStep = Math.max(1, Math.min(4, parseInt(step, 10) || 1));
    nmapWizardState.step = nextStep;

    [1, 2, 3, 4].forEach((index) => {
        const indicator = document.getElementById(`nmap-wizard-indicator-${index}`);
        if (indicator) {
            indicator.classList.toggle("is-active", index === nextStep);
        }
        const page = document.getElementById(`nmap-wizard-step-${index}`);
        if (page) {
            page.classList.toggle("is-active", index === nextStep);
        }
    });

    const back = document.getElementById("nmap-wizard-back");
    const next = document.getElementById("nmap-wizard-next");
    if (back) {
        back.disabled = nextStep <= 1;
    }
    if (next) {
        next.disabled = nextStep >= 4;
        next.style.display = nextStep >= 4 ? "none" : "";
    }
    refreshNmapScanButtonState();
}


export function refreshNmapModeOptions() {
    const mode = getSelectedNmapMode();
    if (mode !== nmapWizardState.lastMode) {
        applyNmapModeTargetDefaults(mode);
        nmapWizardState.lastMode = mode;
    }
    const blocks = document.querySelectorAll("[data-mode-options]");
    blocks.forEach((block) => {
        const blockMode = String(block.getAttribute("data-mode-options") || "");
        block.classList.toggle("is-active", blockMode === mode);
    });
    const standardTargetControls = document.getElementById("nmap-standard-target-controls");
    if (standardTargetControls) {
        standardTargetControls.hidden = mode === "passive_capture" || mode === "rfc1918_discovery";
    }
    const passiveTargetControls = document.getElementById("nmap-passive-target-controls");
    if (passiveTargetControls) {
        passiveTargetControls.hidden = mode !== "passive_capture";
    }
    const rfcTargetControls = document.getElementById("nmap-rfc-target-controls");
    if (rfcTargetControls) {
        rfcTargetControls.hidden = mode !== "rfc1918_discovery";
    }
    const hardTopPorts = document.getElementById("nmap-hard-top-ports");
    if (hardTopPorts) {
        hardTopPorts.disabled = getChecked("nmap-hard-full-ports");
    }
    const rfcDiscoveryOnly = getChecked("nmap-rfc-host-discovery-only");
    const rfcDiscoveryNode = document.getElementById("nmap-rfc-discovery");
    if (rfcDiscoveryNode) {
        rfcDiscoveryNode.checked = true;
        rfcDiscoveryNode.disabled = mode === "rfc1918_discovery";
    }
    const rfcForcePnNode = document.getElementById("nmap-rfc-force-pn");
    if (rfcForcePnNode) {
        rfcForcePnNode.checked = false;
        rfcForcePnNode.disabled = true;
    }
    ["nmap-rfc-profile", "nmap-rfc-service-detection", "nmap-rfc-default-scripts", "nmap-rfc-os-detection"]
        .forEach((id) => {
            const node = document.getElementById(id);
            if (node) {
                node.disabled = rfcDiscoveryOnly;
            }
        });
    const rfcProfileNote = document.getElementById("nmap-rfc-profile-note");
    if (rfcProfileNote) {
        const rfcProfile = getSelectedRfcScanProfile();
        const chunkConcurrency = getSelectedRfcChunkConcurrency();
        const profileLabel = rfcProfile === "comprehensive"
            ? "More comprehensive uses a broader common-internal-services TCP list"
            : "Quick uses the curated low-hanging-fruit TCP list";
        const ports = getRfcExplicitPortsForProfile(rfcProfile);
        const chunkLabel = `${chunkConcurrency} chunk scan${chunkConcurrency === 1 ? "" : "s"} at a time`;
        rfcProfileNote.textContent = rfcDiscoveryOnly
            ? `${profileLabel}. RFC sweeps run in /24 chunks, up to 2 subnets per Nmap run, with ${chunkLabel}. Disable discovery-only to scan responsive hosts on: ${ports}.`
            : `${profileLabel}. RFC sweeps run in /24 chunks, up to 2 subnets per Nmap run, with ${chunkLabel}: ${ports}.`;
    }
    const passiveInterfaceNote = document.getElementById("passive-capture-interface-note");
    const passiveSelect = document.getElementById("passive-capture-interface");
    if (mode === "passive_capture" && passiveSelect && passiveInterfaceNote) {
        const selectedOption = passiveSelect.options[passiveSelect.selectedIndex];
        if (selectedOption) {
            const networks = String(selectedOption.dataset.networks || "").trim();
            passiveInterfaceNote.textContent = networks
                ? `Connected networks: ${networks}`
                : "Passive capture will watch discovery traffic on the selected interface.";
        }
    }
    syncNmapPresetDerivedOptions();
    updateNmapCommandPreview();
    refreshNmapScanButtonState();
}


export async function runNmapScan() {
    if (nmapWizardState.postSubmitLock) {
        setActionStatus("Scan failed: enter scan inputs before starting a job.", true);
        refreshNmapScanButtonState();
        return;
    }
    const validation = validateNmapWizardState();
    if (!validation.valid) {
        setActionStatus(`Scan failed: ${validation.reason}`, true);
        const reason = String(validation.reason || "").toLowerCase();
        if (reason.includes("target") || reason.includes("rfc1918") || reason.includes("interface")) {
            setNmapWizardStep(3);
        } else {
            setNmapWizardStep(4);
        }
        return;
    }
    const targets = collectNmapWizardTargets();
    const scanMode = getSelectedNmapMode();
    const scanOptions = getNmapScanOptions(scanMode);
    const discovery = Boolean(scanOptions.discovery);
    const staged = false;
    const engagementPolicy = buildEngagementPolicyForPresetSelection(getSelectedNmapEngagementPreset(), {
        fallbackGoalProfile: getValue("scheduler-goal-select") || "internal_recon",
    });

    setActionStatus("Queueing Nmap scan job...");
    try {
        const schedulerPrefs = await postJson("/api/scheduler/preferences", {
            engagement_policy: engagementPolicy,
            goal_profile: legacyGoalProfileFromEngagementPolicy(engagementPolicy),
        });
        applySchedulerPreferences(schedulerPrefs);
        const body = scanMode === "passive_capture"
            ? await postJson("/api/scan/passive-capture", {
                interface_name: getValue("passive-capture-interface").trim(),
                duration_minutes: getSelectedPassiveCaptureDuration(),
                run_actions: getChecked("nmap-run-actions"),
                scan_mode: scanMode,
            })
            : await postJson("/api/nmap/scan", {
                targets,
                discovery,
                staged,
                run_actions: getChecked("nmap-run-actions"),
                nmap_path: "nmap",
                nmap_args: getValue("nmap-args").trim(),
                scan_mode: scanMode,
                scan_options: scanOptions,
            });
        const jobId = body?.job?.id;
        setActionStatus(
            jobId
                ? `${scanMode === "passive_capture" ? "Passive capture" : "Nmap scan"} queued (job ${jobId})`
                : (scanMode === "passive_capture" ? "Passive capture queued" : "Nmap scan queued"),
        );
        closeNmapScanModalAction();
        setValue("nmap-targets", "");
        nmapWizardState.postSubmitLock = true;
        setNmapWizardStep(1);
        updateNmapCommandPreview();
        refreshNmapScanButtonState();
        await pollSnapshot();
    } catch (err) {
        setActionStatus(`Scan failed: ${err.message}`, true);
    }
}
