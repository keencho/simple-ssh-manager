import { invoke } from "@tauri-apps/api/core";
import type { SessionOption, AddTabPayload } from "./types";

// SSH session orchestration

export const openSsh = (id: string, newWindow: boolean): Promise<void> =>
  invoke("open_ssh", { id, newWindow });

export const getSshArgsForSession = (id: string): Promise<SessionOption> =>
  invoke("get_ssh_args_for_session", { id });

export const getSessionHome = (sessionId: string): Promise<string> =>
  invoke("get_session_home", { sessionId });

export const spawnTerminal = (params: {
  sshArgs: string[];
  title: string;
  newWindow: boolean;
  sourceLabel: string;
  sessionId: string | null;
}): Promise<void> => invoke("spawn_terminal", params);

export const dropTab = (params: {
  sourceLabel: string;
  terminalId: string;
  title: string;
  sshArgs: string[];
  sessionId: string | null;
  initialContent: string;
  screenX: number;
  screenY: number;
  isLastTab: boolean;
}): Promise<boolean> => invoke("drop_tab", params);

// PTY operations

export const ptySpawn = (params: {
  terminalId: string;
  sshArgs: string[];
  sessionId?: string | null;
  rows: number;
  cols: number;
}): Promise<void> => invoke("pty_spawn", params);

export const ptyWrite = (terminalId: string, data: number[]): Promise<void> =>
  invoke("pty_write", { terminalId, data });

export const ptyResize = (terminalId: string, rows: number, cols: number): Promise<void> =>
  invoke("pty_resize", { terminalId, rows, cols });

export const ptyKill = (terminalId: string): Promise<void> =>
  invoke("pty_kill", { terminalId });

export const ptyTakePending = (windowLabel: string): Promise<AddTabPayload | null> =>
  invoke("pty_take_pending", { windowLabel });
