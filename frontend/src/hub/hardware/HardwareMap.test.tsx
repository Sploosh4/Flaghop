import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {HardwareMap} from './HardwareMap';
import {hardwareGraph, hardwareLayout} from './model';
import type {HubProject, HubSettings, NetworkContext, Snapshot} from '../api';

const project: HubProject = {id: 'a', name: 'Lab', folder: '/Lab', path: '/Lab/workspace.legion', managed: true};
const settings: HubSettings = {computer: {name: 'fixture-laptop', system: 'Linux'}, vpn_status: 'unconfigured', projects_folder: '/Projects', vpns: []};
const snapshot: Snapshot = {project: {name: project.path}, hosts: [
  {id: 1, ip: '192.0.2.10', hostname: 'server-01', os: 'Linux', categories: ['Server']},
  {id: 2, ip: '192.0.2.20', hostname: '', os: 'Unknown', categories: []},
  {id: 3, ip: '192.0.2.30', hostname: 'printer-01', categories: ['Printer']},
]};
const network: NetworkContext = {project_id: 'a', config_id: 'net-a', revision: 2, connector: 'wireguard', configured: true,
  settings: {mode: 'wireguard', interface: 'wg-lab'}, enforcement_available: true, enforcement_reason: '', recent_checks: [
    {status: 'ready', revision: 2, checked_at: '2026-10-31T00:00:00Z', reason: '', target: '192.0.2.10', routes: [{destination: '192.0.2.10', interface: 'wg-lab'}]},
  ]};
const build = () => hardwareGraph(project, snapshot, settings, network);
beforeEach(() => localStorage.clear());
afterEach(cleanup);

it('uses current project inventory and omits unknown labels instead of guessing', () => {
  const graph = build();
  expect(graph.nodes.find(node => node.id === 'host-1')?.artwork).toBe('server');
  expect(graph.nodes.find(node => node.id === 'host-3')?.artwork).toBe('network-printer');
  expect(graph.nodes.find(node => node.id === 'host-2')).toMatchObject({artwork: 'unknown-device', os: '', hostname: ''});
  const osOnly = {...snapshot, hosts: [{id: 9, ip: '192.0.2.9', os: 'Linux', categories: ['Linux']}]};
  expect(hardwareGraph(project, osOnly, settings, null).nodes.find(node => node.hostId === 9)?.artwork).toBe('unknown-device');
  expect(hardwareGraph({...project, path: '/Other/workspace.legion', id: 'b'}, snapshot, settings, network).nodes.map(node => node.id)).toEqual(['laptop', 'vpn']);
  expect(hardwareGraph({...project, id: 'b'}, snapshot, settings, network).links).toEqual([]);
});

it('draws only saved matching route observations and never invents subnet/physical links', () => {
  expect(build().links.map(link => [link.from, link.to])).toEqual([['vpn', 'host-1'], ['laptop', 'vpn']]);
  expect(hardwareGraph(project, snapshot, settings, null).links).toEqual([]);
  expect(hardwareGraph(project, snapshot, settings, {...network, revision: 3}).links).toEqual([]);
  const failed = {...network, recent_checks: [...network.recent_checks!, {status: 'held' as const, revision: 2, checked_at: 'later', reason: 'Disconnected', target: '192.0.2.10'}]};
  expect(hardwareGraph(project, snapshot, settings, failed).links).toEqual([]);
  const local = hardwareGraph(project, snapshot, settings, {...network, settings: {...network.settings, mode: 'local'}});
  expect(local.nodes.some(node => node.id === 'vpn')).toBe(false);
  expect(local.links.map(link => link.from)).toEqual(['laptop']);
});

it('labels the selected VPN protocol without treating its configuration as a connection', () => {
  const label = (context: NetworkContext | null, connector?: HubProject['connector']) => hardwareGraph({...project, connector}, snapshot, settings, context).nodes.find(node => node.id === 'vpn')?.label;
  expect(label(network)).toBe('WireGuard');
  expect(label({...network, settings: {...network.settings, mode: 'openvpn'}})).toBe('OpenVPN');
  expect(label(null, 'wireguard')).toBe('WireGuard');
  expect(label(null, 'openvpn')).toBe('OpenVPN');
  expect(label(null, 'networkmanager')).toBe('Unknown');
  expect(label(null)).toBe('Unknown');
  expect(label({...network, project_id: 'another-project'}, 'openvpn')).toBe('OpenVPN');
  expect(hardwareGraph({...project, connector: 'wireguard'}, snapshot, settings, null).links).toEqual([]);
});

it('lays observed hops above local origins and makes room for growing inventories', () => {
  const graph = build(), base = hardwareLayout(graph);
  expect(base.nodes.find(node => node.id === 'host-1')!.y).toBeLessThan(base.nodes.find(node => node.id === 'vpn')!.y);
  const grown = hardwareLayout({...graph, nodes: [...graph.nodes, ...Array.from({length: 40}, (_, i) => ({...graph.nodes[2], id: `extra-${i}`}))]});
  expect(grown.height).toBeGreaterThan(base.height);
  expect(new Set(grown.nodes.map(node => `${node.x},${node.y}`)).size).toBe(grown.nodes.length);
});

it('selects one picture, supports 1–9 and Home, and respects text entry', () => {
  const onSelect = vi.fn();
  render(<><input aria-label="Notes"/><HardwareMap projectId="a" graph={build()} onSelect={onSelect} onOpen={vi.fn()} onSetup={vi.fn()}/></>);
  const first = screen.getByRole('button', {name: '192.0.2.10 · server-01 · Linux'});
  fireEvent.click(first); expect(first.getAttribute('aria-pressed')).toBe('true');
  fireEvent.keyDown(document, {key: '2'});
  expect(first.getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', {name: '192.0.2.20'}).getAttribute('aria-pressed')).toBe('true');
  fireEvent.keyDown(screen.getByRole('textbox', {name: 'Notes'}), {key: '1'});
  expect(first.getAttribute('aria-pressed')).toBe('false');
  fireEvent.keyDown(document, {key: '0'});
  expect(onSelect).toHaveBeenLastCalledWith(null);
  expect(document.querySelectorAll('.hardware-node[aria-pressed=true]')).toHaveLength(0);
});

it('keeps shortcut numbers reserved when a discovered device is removed', () => {
  const graph = build(), onSelect = vi.fn();
  const props = {projectId: 'a', graph, onSelect, onOpen: vi.fn(), onSetup: vi.fn()};
  const view = render(<HardwareMap {...props}/>);
  view.rerender(<HardwareMap {...props} graph={{...graph, nodes: graph.nodes.filter(node => node.id !== 'host-1')}}/>);
  fireEvent.keyDown(document, {key: '1'}); expect(onSelect).not.toHaveBeenCalled();
  fireEvent.keyDown(document, {key: '2'}); expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({id: 'host-2'}));
});

it('opens existing details from double click or the keyboard context menu without running a job', () => {
  const onOpen = vi.fn(), onSelect = vi.fn();
  render(<HardwareMap projectId="a" graph={build()} onSelect={onSelect} onOpen={onOpen} onSetup={vi.fn()}/>);
  const first = screen.getByRole('button', {name: '192.0.2.10 · server-01 · Linux'});
  fireEvent.doubleClick(first); expect(onOpen).toHaveBeenCalledWith(1);
  fireEvent.click(first); fireEvent.keyDown(document, {key: '`'});
  expect(within(screen.getByRole('menu', {name: 'Device actions'})).getByRole('menuitem', {name: 'Details'})).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('menu', {name: 'Device actions'}), {key: '1'});
  expect(onOpen).toHaveBeenCalledTimes(2);
});

it('clears an unavailable selected target when live inventory changes', () => {
  const graph = build(), onSelect = vi.fn();
  const props = {projectId: 'a', graph, onSelect, onOpen: vi.fn(), onSetup: vi.fn()};
  const view = render(<HardwareMap {...props}/>);
  fireEvent.click(screen.getByRole('button', {name: '192.0.2.10 · server-01 · Linux'}));
  view.rerender(<HardwareMap {...props} graph={{...graph, nodes: graph.nodes.filter(node => node.id !== 'host-1')}}/>);
  expect(onSelect).toHaveBeenLastCalledWith(null);
});
