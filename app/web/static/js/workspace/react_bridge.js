/** Narrow migration boundary. React owns its DOM; legacy views only publish data/actions. */
let bindings = null;
let project = null;
let jobs = [];

export function connectReactWorkspace(next) {
    bindings = next;
    if (project) bindings.updateProject(project);
    bindings.updateJobs(jobs);
    return () => { if (bindings === next) bindings = null; };
}

export function publishWorkspaceProject(value) {
    project = value;
    bindings?.updateProject(value);
}

export function publishWorkspaceJobs(value) {
    jobs = value;
    bindings?.updateJobs(value);
}

export function beginWorkspaceRename(location = "sidebar") {
    bindings?.beginRename(location);
}
