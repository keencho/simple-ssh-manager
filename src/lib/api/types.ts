// Shared types — must stay in sync with Rust structs in src-tauri/src/main.rs.

export type AuthMethod = "key" | "password";

export interface JumpHost {
  host: string;
  port: number;
  user: string;
  key_file: string;
  auth_method: AuthMethod;
  store_password: boolean;
}

export interface SshSession {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  key_file: string;
  folder_id: string | null;
  order: number;
  jump_host: JumpHost | null;
  auth_method: AuthMethod;
  store_password: boolean;
}

export interface PasswordNeed {
  slot: "target" | "jump";
  user: string;
  host: string;
}

export interface Folder {
  id: string;
  name: string;
  order: number;
}

export interface SessionsData {
  folders: Folder[];
  sessions: SshSession[];
  root_folder_order: number | null;
}

export interface RemoteEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
  permissions: string;
}

export interface SftpProgress {
  session_id: string;
  filename: string;
  bytes_transferred: number;
  total_bytes: number;
  direction: string;
}

export interface AddTabPayload {
  terminal_id: string;
  title: string;
  ssh_args: string[];
  session_id?: string | null;
  adopt?: boolean;
  initial_content?: string;
}

export interface MergeTabPayload {
  terminal_id: string;
  title: string;
  ssh_args: string[];
  session_id?: string | null;
  initial_content: string;
  screen_x: number;
  screen_y: number;
}

export interface PtyOutput {
  terminal_id: string;
  data: number[];
}

export interface PtyExit {
  terminal_id: string;
}

export interface SessionOption {
  title: string;
  ssh_args: string[];
}
