/** Workspace http. */


export async function postJson(url, payload) {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload || {}),
    });
    let body = {};
    try {
        body = await response.json();
    } catch (_err) {
    }
    if (!response.ok) {
        const message = body.error || `Request failed (${response.status})`;
        throw new Error(message);
    }
    return body;
}


export async function fetchJson(url) {
    const response = await fetch(url, {cache: "no-store"});
    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }
    return response.json();
}
