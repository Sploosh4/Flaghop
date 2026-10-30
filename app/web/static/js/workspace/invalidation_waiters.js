import { workspaceInvalidationWaiters } from "./state.js";
/** invalidation waiters: shared behavior independent of action controllers. */
export function waitForWorkspaceInvalidation(channels, timeoutMs = 5000) {
    const normalized = new Set((channels || []).map((item) => String(item || "").trim()).filter(Boolean));
    if (!normalized.size) {
        return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
        const waiter = {
            channels: normalized,
            resolve,
            timeoutId: 0,
        };
        waiter.timeoutId = window.setTimeout(() => {
            const index = workspaceInvalidationWaiters.indexOf(waiter);
            if (index >= 0) {
                workspaceInvalidationWaiters.splice(index, 1);
            }
            reject(new Error("Timed out waiting for workspace update."));
        }, Math.max(1, Number(timeoutMs) || 1));
        workspaceInvalidationWaiters.push(waiter);
    });
}



export function notifyWorkspaceInvalidationWaiters(channels) {
    const normalized = new Set((channels || []).map((item) => String(item || "").trim()).filter(Boolean));
    if (!normalized.size || !workspaceInvalidationWaiters.length) {
        return;
    }
    for (let index = workspaceInvalidationWaiters.length - 1; index >= 0; index -= 1) {
        const waiter = workspaceInvalidationWaiters[index];
        const matches = Array.from(waiter.channels || []).some((channel) => normalized.has(channel));
        if (!matches) {
            continue;
        }
        workspaceInvalidationWaiters.splice(index, 1);
        if (waiter.timeoutId) {
            window.clearTimeout(waiter.timeoutId);
        }
        try {
            waiter.resolve(Array.from(normalized));
        } catch (_err) {
        }
    }
}
