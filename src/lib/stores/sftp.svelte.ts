import type { RemoteEntry } from "../api/types";

// ---------- Types ----------

export type SftpSortMode = "type" | "name" | "modified" | "modified-asc" | "size";

export interface SftpTransfer {
  filename: string;
  bytes: number;
  total: number;
  direction: string;
}

export interface SftpPanelData {
  id: string;
  sessionId: string;
  sessionName: string;
  status: "connecting" | "ready" | "error";
  errorMsg: string | null;
  homeDir: string;
  currentDir: string;
  entries: RemoteEntry[];
  loading: boolean;
  loadError: string | null;
  sortMode: SftpSortMode;
  selected: Set<string>;
  transfers: SftpTransfer[];
  z: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

// ---------- Reactive state ----------

const _state = $state<{
  panels: SftpPanelData[];
  zCounter: number;
  panelCounter: number;
}>({
  panels: [],
  zCounter: 1000,
  panelCounter: 0,
});

export const sftpStore = {
  get panels(): SftpPanelData[] { return _state.panels; },
};

// ---------- Mutators ----------

export function nextPanelId(): string {
  return `sftp-${++_state.panelCounter}`;
}

export function nextOffset(): number {
  return (_state.panelCounter % 5) * 30;
}

export function nextZ(): number {
  return ++_state.zCounter;
}

export function findPanel(id: string): SftpPanelData | undefined {
  return _state.panels.find(p => p.id === id);
}

export function addPanel(p: SftpPanelData): void {
  _state.panels.push(p);
}

export function removePanel(id: string): void {
  const idx = _state.panels.findIndex(p => p.id === id);
  if (idx >= 0) _state.panels.splice(idx, 1);
}

export function bringPanelToFront(id: string): void {
  const p = findPanel(id);
  if (!p) return;
  p.z = nextZ();
}

export function setPanelStatus(id: string, status: SftpPanelData["status"], errorMsg?: string | null): void {
  const p = findPanel(id);
  if (!p) return;
  p.status = status;
  p.errorMsg = errorMsg ?? null;
}

export function setPanelDir(id: string, dir: string): void {
  const p = findPanel(id);
  if (!p) return;
  p.currentDir = dir;
}

export function setPanelHome(id: string, home: string): void {
  const p = findPanel(id);
  if (!p) return;
  p.homeDir = home;
}

export function setPanelEntries(id: string, entries: RemoteEntry[]): void {
  const p = findPanel(id);
  if (!p) return;
  p.entries = entries;
  p.selected.clear();
}

export function setPanelLoading(id: string, loading: boolean): void {
  const p = findPanel(id);
  if (!p) return;
  p.loading = loading;
  if (loading) p.loadError = null;
}

export function setPanelLoadError(id: string, err: string | null): void {
  const p = findPanel(id);
  if (!p) return;
  p.loadError = err;
  p.loading = false;
}

export function setPanelSort(id: string, mode: SftpSortMode): void {
  const p = findPanel(id);
  if (!p) return;
  p.sortMode = mode;
}

export function togglePanelSelected(id: string, path: string): void {
  const p = findPanel(id);
  if (!p) return;
  if (p.selected.has(path)) p.selected.delete(path);
  else p.selected.add(path);
  p.selected = new Set(p.selected); // re-trigger
}

export function clearPanelSelection(id: string): void {
  const p = findPanel(id);
  if (!p) return;
  p.selected = new Set();
}

export function setPanelGeometry(id: string, g: { left?: number; top?: number; width?: number; height?: number }): void {
  const p = findPanel(id);
  if (!p) return;
  if (g.left !== undefined) p.left = g.left;
  if (g.top !== undefined) p.top = g.top;
  if (g.width !== undefined) p.width = g.width;
  if (g.height !== undefined) p.height = g.height;
}

export function upsertTransfer(id: string, t: SftpTransfer): void {
  const p = findPanel(id);
  if (!p) return;
  const idx = p.transfers.findIndex(x => x.filename === t.filename);
  if (idx >= 0) p.transfers[idx] = t;
  else p.transfers.push(t);
}

export function removeTransfer(id: string, filename: string): void {
  const p = findPanel(id);
  if (!p) return;
  const idx = p.transfers.findIndex(x => x.filename === filename);
  if (idx >= 0) p.transfers.splice(idx, 1);
}

// ---------- Sort helper ----------

export function sortEntries(entries: RemoteEntry[], mode: SftpSortMode): RemoteEntry[] {
  const sorted = entries.slice();
  sorted.sort((a, b) => {
    if (mode === "type") return b.is_dir === a.is_dir ? a.name.toLowerCase().localeCompare(b.name.toLowerCase()) : b.is_dir ? 1 : -1;
    if (mode === "name") return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    if (mode === "modified") return b.modified - a.modified;
    if (mode === "modified-asc") return a.modified - b.modified;
    if (mode === "size") return b.size - a.size;
    return 0;
  });
  return sorted;
}
