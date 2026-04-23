<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import { panelDrag, panelResize } from "../../dnd/floatingPanel";
  import {
    closeSftpPanel,
    deleteEntry,
    downloadOne,
    downloadSelected,
    focusPanel,
    loadDir,
    makeDir,
    moveGeometry,
    persistPanelSize,
    refreshDir,
    setSortMode,
    toggleSelected,
    uploadFiles,
    uploadFromDialog,
  } from "../../sftp/operations";
  import { sortEntries, type SftpPanelData, type SftpSortMode } from "../../stores/sftp.svelte";
  import Breadcrumb from "./Breadcrumb.svelte";
  import FileRow from "./FileRow.svelte";

  let { panel }: { panel: SftpPanelData } = $props();

  let panelEl: HTMLElement;
  let headerEl: HTMLElement | null = $state(null);

  const sortedEntries = $derived(sortEntries(panel.entries, panel.sortMode));
  const hasSelection = $derived(panel.selected.size > 0);

  const parentDir = $derived.by(() => {
    if (panel.currentDir === "/" || !panel.currentDir) return null;
    return panel.currentDir.replace(/\/[^/]+\/?$/, "") || "/";
  });

  // ----- Drag-drop upload (HTML5) -----

  let dragDepth = 0;
  let dropActive = $state(false);

  function onDragEnter(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
    dragDepth++;
    dropActive = true;
  }
  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
  function onDragLeave(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dropActive = false;
  }
  function onDrop(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
    dragDepth = 0;
    dropActive = false;
    const files = Array.from(e.dataTransfer.files);
    void uploadFiles(panel.id, files);
  }

  function onSortChange(e: Event) {
    setSortMode(panel.id, (e.target as HTMLSelectElement).value as SftpSortMode);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={panelEl}
  class="sftp-panel"
  id={panel.id}
  style="left: {panel.left}px; top: {panel.top}px; width: {panel.width}px; height: {panel.height}px; z-index: {panel.z}"
  onmousedown={() => focusPanel(panel.id)}
  ondragenter={onDragEnter}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
  use:panelDrag={{
    handle: () => headerEl,
    onMove: (l, t) => moveGeometry(panel.id, { left: l, top: t }),
    onPress: () => focusPanel(panel.id),
  }}
>
  <div class="sftp-header" bind:this={headerEl}>
    <div class="sftp-title">{@html ICONS.fileManager} {panel.sessionName}</div>
    <button class="sftp-close" onclick={() => void closeSftpPanel(panel.id)}>{@html ICONS.close}</button>
  </div>

  {#if panel.status === "connecting"}
    <div class="sftp-connecting">
      <div class="sftp-spinner"></div>
      <span>{$_("sftp.connecting")}</span>
    </div>
  {:else if panel.status === "error"}
    <div class="sftp-connecting">
      <div class="sftp-error">{panel.errorMsg}</div>
    </div>
  {:else}
    <div class="sftp-body">
      <div class="sftp-toolbar">
        <Breadcrumb panelId={panel.id} sessionId={panel.sessionId} currentDir={panel.currentDir} />
        <div class="sftp-actions">
          {#if hasSelection}
            <button
              class="btn-action btn-sftp sftp-dl-selected-btn"
              onclick={() => void downloadSelected(panel.id)}
            >{@html ICONS.download} {$_("sftp.actions.download")}</button>
          {/if}
          <button
            class="btn-action btn-sftp sftp-upload-btn"
            onclick={() => void uploadFromDialog(panel.id)}
          >{@html ICONS.upload} {$_("sftp.actions.upload")}</button>
          <button
            class="btn-action btn-sftp sftp-mkdir-btn"
            onclick={() => void makeDir(panel.id)}
          >{@html ICONS.folderPlus} {$_("sftp.actions.mkdir")}</button>
          <select
            class="sftp-sort-select"
            title={$_("sftp.actions.sortByTitle")}
            value={panel.sortMode}
            onchange={onSortChange}
          >
            <option value="type">{$_("sftp.sortOptions.type")}</option>
            <option value="name">{$_("sftp.sortOptions.name")}</option>
            <option value="modified">{$_("sftp.sortOptions.modified")}</option>
            <option value="modified-asc">{$_("sftp.sortOptions.modifiedAsc")}</option>
            <option value="size">{$_("sftp.sortOptions.size")}</option>
          </select>
          <button
            class="btn-ghost sftp-refresh-btn"
            title={$_("sftp.actions.refresh")}
            onclick={() => void refreshDir(panel.id)}
          >{@html ICONS.refresh}</button>
        </div>
      </div>

      <div class="sftp-file-list">
        {#if panel.loading}
          <div class="sftp-loading"><div class="sftp-spinner"></div></div>
        {:else if panel.loadError}
          <div class="sftp-error">{panel.loadError}</div>
        {:else}
          {#if parentDir}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="sftp-row sftp-row-dir"
              role="button"
              tabindex="0"
              onclick={() => void loadDir(panel.id, parentDir)}
            >
              <div class="sftp-row-check"></div>
              <div class="sftp-row-icon">{@html ICONS.arrowUp}</div>
              <div class="sftp-row-name">..</div>
              <div class="sftp-row-size"></div>
              <div class="sftp-row-date"></div>
              <div class="sftp-row-perm"></div>
              <div class="sftp-row-actions"></div>
            </div>
          {/if}
          {#each sortedEntries as entry (entry.path)}
            <FileRow
              {entry}
              selected={panel.selected.has(entry.path)}
              onActivate={() => void loadDir(panel.id, entry.path)}
              onToggleSelect={() => toggleSelected(panel.id, entry.path)}
              onDownload={() => void downloadOne(panel.id, entry.path, entry.name)}
              onDelete={() => void deleteEntry(panel.id, entry.path, entry.is_dir)}
            />
          {/each}
          {#if sortedEntries.length === 0}
            <div class="sftp-empty">{$_("sftp.empty")}</div>
          {/if}
        {/if}
      </div>

      <div class="sftp-drop-zone {dropActive ? 'sftp-drop-active' : ''}">{$_("sftp.dropZone")}</div>

      <div class="sftp-progress-area">
        {#each panel.transfers as t (t.filename)}
          {@const pct = t.total > 0 ? Math.round((t.bytes / t.total) * 100) : 0}
          <div class="sftp-progress-item">
            <span class="sftp-progress-name">{@html t.direction === "upload" ? ICONS.upload : ICONS.download} {t.filename}</span>
            <div class="sftp-progress-bar"><div class="sftp-progress-fill" style="width:{pct}%"></div></div>
            <span class="sftp-progress-pct">{pct}%</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div
    class="sftp-resize-handle"
    use:panelResize={{
      onResize: (w, h) => moveGeometry(panel.id, { width: w, height: h }),
      onCommit: (w, h) => persistPanelSize(w, h),
      minW: 500,
      minH: 350,
      getStartSize: () => ({ width: panel.width, height: panel.height }),
    }}
  ></div>
</div>
