import type { SshSession } from "../../api/types";

export interface SidebarActions {
  connect(sid: string, newWindow: boolean): void;
  openSftp(sid: string): void;
  editSession(s: SshSession): void;
  duplicateSession(sid: string): Promise<void>;
  deleteSession(sid: string): Promise<void>;
  addInFolder(folderId: string | null): void;
  editFolder(fid: string): Promise<void>;
  deleteFolder(fid: string): Promise<void>;
}

export interface ContextMenuItem {
  label: string;        // "-" for separator
  icon?: string;
  action: () => void;
  danger?: boolean;
}
