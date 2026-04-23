import * as Data from "../api/data";
import type { SessionsData, SshSession, Folder } from "../api/types";

const _data = $state<SessionsData>({
  folders: [],
  sessions: [],
  root_folder_order: null,
});

export const dataStore = {
  get sessions(): SshSession[] { return _data.sessions; },
  get folders(): Folder[] { return _data.folders; },
  get rootFolderOrder(): number | null { return _data.root_folder_order; },
  get raw(): SessionsData { return _data; },
};

export function setData(d: SessionsData): void {
  _data.folders = d.folders;
  _data.sessions = d.sessions;
  _data.root_folder_order = d.root_folder_order;
}

export async function loadData(): Promise<void> {
  setData(await Data.getAllData());
}

export function getSortedFolders(): Folder[] {
  return [...dataStore.folders].sort((a, b) => a.order - b.order);
}

export function getFolderName(folderId: string | null): string {
  if (!folderId) return "";
  return dataStore.folders.find((f) => f.id === folderId)?.name || "";
}

export function getSessionsForFolder(
  folderId: string | null,
  searchQuery: string,
): SshSession[] {
  const q = searchQuery.toLowerCase();
  return dataStore.sessions
    .filter((s) => {
      if (s.folder_id !== folderId) return false;
      if (!q) return true;
      const folderName = getFolderName(s.folder_id).toLowerCase();
      return s.name.toLowerCase().includes(q)
        || s.host.toLowerCase().includes(q)
        || s.user.toLowerCase().includes(q)
        || folderName.includes(q);
    })
    .sort((a, b) => a.order - b.order);
}

export function hasMatchingSessionsInFolder(folderId: string, searchQuery: string): boolean {
  if (!searchQuery) return true;
  return getSessionsForFolder(folderId, searchQuery).length > 0;
}
