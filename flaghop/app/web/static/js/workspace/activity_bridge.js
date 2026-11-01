/** Legacy shells publish snapshots and request actions; React owns activity state and DOM. */
let bindings = null;
const panels = new Map();
const pending = [];

export function connectReactActivity(next) {
    bindings = next;
    panels.forEach((value, name) => bindings.update(name, value));
    pending.splice(0).forEach(({action, args, resolve, reject}) => {
        Promise.resolve().then(() => next.actions[action](...args)).then(resolve, reject);
    });
    return () => { if (bindings === next) bindings = null; };
}

export function publishActivity(name, value) {
    panels.set(name, value);
    bindings?.update(name, value);
}

export function requestActivity(action, ...args) {
    if (bindings) return bindings.actions[action](...args);
    return new Promise((resolve, reject) => pending.push({action, args, resolve, reject}));
}
