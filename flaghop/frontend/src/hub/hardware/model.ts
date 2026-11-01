import type {HubProject, HubSettings, NetworkContext, Snapshot} from '../api';

export type Artwork = 'laptop' | 'vpn-appliance' | 'computer' | 'server' | 'network-printer' | 'unknown-device';
export interface HardwareNode {
  id: string; artwork: Artwork; hostname: string; ip: string; os: string;
  kind: 'host' | 'laptop' | 'vpn'; hostId?: number; label?: string;
}
export interface HardwareLink {id: string; from: string; to: string; kind: 'route' | 'vpn'; observedAt: string}
export interface HardwareGraph {nodes: HardwareNode[]; links: HardwareLink[]}
export interface PositionedNode extends HardwareNode {x: number; y: number}

const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const known = (value: unknown) => typeof value === 'string' && !['unknown', 'n/a', 'none', '—'].includes(value.trim().toLowerCase()) ? value.trim() : '';

function hostNode(value: unknown): HardwareNode | null {
  const row = record(value), id = row.id;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null;
  const categories = Array.isArray(row.categories) ? row.categories.map(value => known(value).toLowerCase()) : [];
  // These are illustrations of the existing inventory's role labels, not new classification.
  const artwork: Artwork = categories.some(value => /^(printer|network printer)$/.test(value)) ? 'network-printer'
    : categories.includes('server') ? 'server'
    : categories.some(value => /^(workstation|desktop|computer)$/.test(value)) ? 'computer' : 'unknown-device';
  return {id: `host-${id}`, hostId: id, kind: 'host', artwork, hostname: known(row.hostname), ip: known(row.ip), os: known(row.os)};
}

export function hardwareGraph(project: Pick<HubProject, 'id' | 'path' | 'vpn' | 'connector'>, snapshot: Snapshot | null, settings: HubSettings | null, network: NetworkContext | null): HardwareGraph {
  if (network?.project_id !== project.id) network = null;
  const laptop: HardwareNode = {id: 'laptop', kind: 'laptop', artwork: 'laptop', label: 'Laptop', hostname: settings?.computer.name || '', os: settings?.computer.system || '', ip: ''};
  const nodes = [laptop];
  const hasVpn = network?.configured ? network.settings.mode !== 'local' : project.vpn !== 'none';
  const mode = network?.settings.mode;
  const vpnType = mode && mode !== 'local' ? mode : network?.connector || project.connector;
  const vpnLabel = vpnType === 'wireguard' ? 'WireGuard' : vpnType === 'openvpn' ? 'OpenVPN' : 'Unknown';
  if (hasVpn) nodes.push({id: 'vpn', kind: 'vpn', artwork: 'vpn-appliance', label: vpnLabel, hostname: '', os: '', ip: ''});
  // The live snapshot can still belong to the project we just left.
  if (snapshot?.project.name === project.path && Array.isArray(snapshot.hosts)) {
    const seen = new Set<string>();
    for (const value of snapshot.hosts) {
      const node = hostNode(value);
      if (node && !seen.has(node.id)) {seen.add(node.id); nodes.push(node);}
    }
  }
  nodes.sort((a, b) => a.kind === 'host' && b.kind === 'host' ? a.hostId! - b.hostId! : 0);
  const links: HardwareLink[] = [];
  if (network?.configured) {
    const origin = hasVpn ? 'vpn' : 'laptop', seen = new Set<string>();
    for (const check of [...network.recent_checks || []].reverse()) {
      if (check.revision !== network.revision) continue;
      for (const node of nodes) {
        if (node.kind !== 'host' || seen.has(node.id)) continue;
        const route = (check.routes || []).map(record).find(route => route.destination === node.ip);
        const targets = (check.target || '').split(/,\s*/);
        if (!route && !targets.includes(node.ip) && !(node.hostname && targets.includes(node.hostname))) continue;
        seen.add(node.id);
        if (check.status === 'ready' && route?.interface === network.settings.interface) {
          links.push({id: `route-${node.id}`, from: origin, to: node.id, kind: 'route', observedAt: check.checked_at});
        }
      }
    }
    if (hasVpn && links.length) links.push({id: 'vpn-route', from: 'laptop', to: 'vpn', kind: 'vpn', observedAt: links[0].observedAt});
  }
  return {nodes, links};
}

/** Stable topology bands above the local origins; disconnected inventory stays unlinked. */
export function hardwareLayout(graph: HardwareGraph): {nodes: PositionedNode[]; width: number; height: number} {
  const depths = new Map<string, number>(), queue = graph.nodes.filter(node => node.kind !== 'host').map(node => node.id);
  for (const id of queue) depths.set(id, 0);
  const neighbours = new Map<string, string[]>();
  for (const link of graph.links) {
    neighbours.set(link.from, [...neighbours.get(link.from) || [], link.to]);
    neighbours.set(link.to, [...neighbours.get(link.to) || [], link.from]);
  }
  for (let i = 0; i < queue.length; i++) for (const next of neighbours.get(queue[i]) || []) {
    if (!depths.has(next)) {depths.set(next, depths.get(queue[i])! + 1); queue.push(next);}
  }
  const groups = new Map<number, HardwareNode[]>();
  for (const node of graph.nodes.filter(node => node.kind === 'host')) {
    const depth = depths.get(node.id) || 1;
    groups.set(depth, [...groups.get(depth) || [], node]);
  }
  const columns = 5, stepX = 175, stepY = 180;
  const rows = [...groups.values()].reduce((sum, group) => sum + Math.ceil(group.length / columns), 0);
  const width = 840, height = Math.max(650, rows * stepY + 250), rootY = height - 110;
  const verticalStep = (rootY - 100) / Math.max(1, rows);
  const origins = graph.nodes.filter(node => node.kind !== 'host');
  const nodes: PositionedNode[] = origins.map((node, i) => ({...node, x: width / 2 + (i - (origins.length - 1) / 2) * 200, y: rootY}));
  let band = 1;
  for (const [, group] of [...groups].sort(([a], [b]) => a - b)) {
    for (let i = 0; i < group.length; i++) {
      const row = Math.floor(i / columns), count = Math.min(columns, group.length - row * columns), column = i % columns;
      nodes.push({...group[i], x: width / 2 + (column - (count - 1) / 2) * stepX, y: rootY - (band + row) * verticalStep});
    }
    band += Math.ceil(group.length / columns);
  }
  return {nodes, width, height};
}
