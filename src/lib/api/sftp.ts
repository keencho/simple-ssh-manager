import { invoke } from "@tauri-apps/api/core";
import type { RemoteEntry } from "./types";

export const sftpConnect = (sessionId: string): Promise<string> =>
  invoke("sftp_connect", { sessionId });

export const sftpDisconnect = (sessionId: string): Promise<void> =>
  invoke("sftp_disconnect", { sessionId });

export const sftpListDir = (sessionId: string, path: string): Promise<RemoteEntry[]> =>
  invoke("sftp_list_dir", { sessionId, path });

export const sftpDownload = (sessionId: string, remotePath: string, localPath: string): Promise<void> =>
  invoke("sftp_download", { sessionId, remotePath, localPath });

export const sftpUpload = (sessionId: string, remoteDir: string, localPath: string): Promise<void> =>
  invoke("sftp_upload", { sessionId, remoteDir, localPath });

export const sftpUploadBytes = (sessionId: string, remoteDir: string, filename: string, data: number[]): Promise<void> =>
  invoke("sftp_upload_bytes", { sessionId, remoteDir, filename, data });

export const sftpMkdir = (sessionId: string, path: string): Promise<void> =>
  invoke("sftp_mkdir", { sessionId, path });

export const sftpDelete = (sessionId: string, path: string, isDir: boolean): Promise<void> =>
  invoke("sftp_delete", { sessionId, path, isDir });
