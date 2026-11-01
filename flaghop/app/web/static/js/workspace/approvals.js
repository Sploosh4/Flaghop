import {requestActivity} from "./activity_bridge.js";
/** Graph and legacy refresh callers share the typed React activity controller. */
export function loadApprovals() { return requestActivity("loadApprovals"); }
export function approveApproval(id, family = "") { return requestActivity("approve", Number(id), family); }
export function rejectApproval(id, family = "") { return requestActivity("reject", Number(id), family); }
