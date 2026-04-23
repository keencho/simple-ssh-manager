<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import type { RemoteEntry } from "../../api/types";

  let {
    entry,
    selected,
    onActivate,
    onToggleSelect,
    onDownload,
    onDelete,
  }: {
    entry: RemoteEntry;
    selected: boolean;
    onActivate: () => void;
    onToggleSelect: () => void;
    onDownload: () => void;
    onDelete: () => void;
  } = $props();

  function humanizeSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(1) + " GB";
  }

  function formatDate(ts: number): string {
    if (!ts) return "-";
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function handleRowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-sftp-action]")) return;
    if (target.closest(".sftp-check")) return;
    if (entry.is_dir) onActivate();
    else onToggleSelect();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="sftp-row {entry.is_dir ? 'sftp-row-dir' : 'sftp-row-file'}"
  role="button"
  tabindex="0"
  onclick={handleRowClick}
>
  <div class="sftp-row-check">
    {#if !entry.is_dir}
      <input
        type="checkbox"
        class="sftp-check"
        checked={selected}
        onchange={onToggleSelect}
      />
    {/if}
  </div>
  <div class="sftp-row-icon">{@html entry.is_dir ? ICONS.folderOpen : ICONS.file}</div>
  <div class="sftp-row-name">{entry.name}</div>
  <div class="sftp-row-size">{entry.is_dir ? "-" : humanizeSize(entry.size)}</div>
  <div class="sftp-row-date">{formatDate(entry.modified)}</div>
  <div class="sftp-row-perm">{entry.permissions}</div>
  <div class="sftp-row-actions">
    {#if !entry.is_dir}
      <button
        class="btn-sm btn-sftp-dl"
        data-sftp-action="download"
        title={$_("sftp.file.downloadTitle")}
        onclick={(e) => { e.stopPropagation(); onDownload(); }}
      >{@html ICONS.download}</button>
    {/if}
    <button
      class="btn-sm btn-delete-sm"
      data-sftp-action="delete"
      title={$_("sftp.file.deleteTitle")}
      onclick={(e) => { e.stopPropagation(); onDelete(); }}
    >{@html ICONS.trash}</button>
  </div>
</div>
