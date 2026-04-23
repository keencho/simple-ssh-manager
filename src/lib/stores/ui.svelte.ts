export type SidebarPosition = "left" | "right";

const SIDEBAR_POSITION_KEY = "kc-sidebar-position";
const SIDEBAR_HIDDEN_KEY = "kc-sidebar-hidden";
const SIDEBAR_WIDTH_KEY = "sidebar-w";
const COLLAPSED_FOLDERS_KEY = "ssh-collapsed-folders";

function loadCollapsedFolders(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_FOLDERS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch { return new Set(); }
}

function saveCollapsedFolders(s: Set<string>) {
  try { localStorage.setItem(COLLAPSED_FOLDERS_KEY, JSON.stringify([...s])); } catch {}
}

const _ui = $state({
  sidebarPosition: ((localStorage.getItem(SIDEBAR_POSITION_KEY) as SidebarPosition) === "right" ? "right" : "left") as SidebarPosition,
  sidebarHidden: localStorage.getItem(SIDEBAR_HIDDEN_KEY) === "1",
  sidebarWidth: Math.max(220, Math.min(500, parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || "280"))),
  searchQuery: "",
  collapsedFolders: loadCollapsedFolders(),
  globalNewWindow: false,
});

export const ui = {
  get sidebarPosition(): SidebarPosition { return _ui.sidebarPosition; },
  setSidebarPosition(v: SidebarPosition) {
    _ui.sidebarPosition = v;
    localStorage.setItem(SIDEBAR_POSITION_KEY, v);
  },

  get sidebarHidden(): boolean { return _ui.sidebarHidden; },
  toggleSidebarHidden() {
    _ui.sidebarHidden = !_ui.sidebarHidden;
    localStorage.setItem(SIDEBAR_HIDDEN_KEY, _ui.sidebarHidden ? "1" : "0");
  },

  get sidebarWidth(): number { return _ui.sidebarWidth; },
  setSidebarWidth(v: number) {
    _ui.sidebarWidth = v;
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(v));
  },

  get searchQuery(): string { return _ui.searchQuery; },
  setSearchQuery(v: string) { _ui.searchQuery = v; },

  get collapsedFolders(): Set<string> { return _ui.collapsedFolders; },
  isCollapsed(id: string): boolean { return _ui.collapsedFolders.has(id); },
  toggleFolder(id: string) {
    const s = new Set(_ui.collapsedFolders);
    if (s.has(id)) s.delete(id); else s.add(id);
    _ui.collapsedFolders = s;
    saveCollapsedFolders(s);
  },
  removeCollapsedFolder(id: string) {
    if (!_ui.collapsedFolders.has(id)) return;
    const s = new Set(_ui.collapsedFolders); s.delete(id);
    _ui.collapsedFolders = s;
    saveCollapsedFolders(s);
  },

  get globalNewWindow(): boolean { return _ui.globalNewWindow; },
  setGlobalNewWindow(v: boolean) { _ui.globalNewWindow = v; },
};
