import { invoke } from "@tauri-apps/api/core";
import type { SessionsData, SshSession, Folder, JumpHost, AuthMethod, PasswordNeed } from "./types";

export const getAllData = (): Promise<SessionsData> =>
  invoke("get_all_data");

export const createSession = (params: {
  name: string;
  host: string;
  port: number;
  user: string;
  keyFile: string;
  folderId: string | null;
  jumpHost: JumpHost | null;
  authMethod: AuthMethod;
  storePassword: boolean;
  password?: string | null;
  jumpPassword?: string | null;
}): Promise<SessionsData> => invoke("create_session", params);

export const updateSession = (session: SshSession, password?: string | null, jumpPassword?: string | null): Promise<SessionsData> =>
  invoke("update_session", { session, password, jumpPassword });

export const checkSessionPasswordNeeds = (sessionId: string): Promise<PasswordNeed[]> =>
  invoke("check_session_password_needs", { sessionId });

export const setSessionPassword = (sessionId: string, slot: "target" | "jump", password: string): Promise<void> =>
  invoke("set_session_password", { sessionId, slot, password });

export const clearSessionPassword = (sessionId: string, slot: "target" | "jump"): Promise<void> =>
  invoke("clear_session_password", { sessionId, slot });

export const deleteSession = (id: string): Promise<SessionsData> =>
  invoke("delete_session", { id });

export const copySession = (id: string): Promise<SessionsData> =>
  invoke("copy_session", { id });

export const createFolder = (name: string): Promise<SessionsData> =>
  invoke("create_folder", { name });

export const updateFolder = (id: string, name: string): Promise<SessionsData> =>
  invoke("update_folder", { id, name });

export const deleteFolder = (id: string): Promise<SessionsData> =>
  invoke("delete_folder", { id });

export const reorderSessions = (sessions: SshSession[]): Promise<SessionsData> =>
  invoke("reorder_sessions", { sessions });

export const reorderFolders = (folders: Folder[], rootFolderOrder: number | null): Promise<SessionsData> =>
  invoke("reorder_folders", { folders, rootFolderOrder });

export const exportSessionsTo = (targetPath: string): Promise<void> =>
  invoke("export_sessions_to", { targetPath });

export const importSessionsFrom = (sourcePath: string): Promise<void> =>
  invoke("import_sessions_from", { sourcePath });
