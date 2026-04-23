<script lang="ts">
  import { _ } from "svelte-i18n";
  import {
    dataStore, getSortedFolders, getSessionsForFolder, hasMatchingSessionsInFolder,
  } from "../../stores/data.svelte";
  import { ui } from "../../stores/ui.svelte";
  import FolderHeader from "./FolderHeader.svelte";
  import SessionRow from "./SessionRow.svelte";
  import type { Folder } from "../../api/types";
  import type { SidebarActions } from "./types";

  let { actions }: { actions: SidebarActions } = $props();

  type FolderEntry = { type: "folder"; folder: Folder } | { type: "root" };

  const folders = $derived(getSortedFolders());
  const rootSessions = $derived(getSessionsForFolder(null, ui.searchQuery));

  const entries = $derived.by((): FolderEntry[] => {
    const showRoot = rootSessions.length > 0 && folders.length > 0;
    const rootOrder = dataStore.rootFolderOrder ?? folders.length;
    const list: FolderEntry[] = folders.map((f) => ({ type: "folder", folder: f }));
    if (showRoot) list.push({ type: "root" });
    list.sort((a, b) => {
      const oa = a.type === "root" ? rootOrder : a.folder.order;
      const ob = b.type === "root" ? rootOrder : b.folder.order;
      return oa - ob;
    });
    return list;
  });

  // Inline (no folder header) sessions when there are no folders at all.
  const flatRootSessions = $derived(folders.length === 0 ? rootSessions : []);

  const renderableEntries = $derived(
    entries.filter((e) => e.type === "root" || hasMatchingSessionsInFolder(e.folder.id, ui.searchQuery)),
  );

  const isEmpty = $derived(dataStore.sessions.length === 0);
  const hasOutput = $derived(renderableEntries.length > 0 || flatRootSessions.length > 0);
</script>

{#if isEmpty}
  <div class="empty">{$_("sidebar.empty.noSessions")}</div>
{:else if !hasOutput}
  <div class="empty">{$_("sidebar.empty.noResults")}</div>
{:else}
  {#each renderableEntries as entry (entry.type === "root" ? "__root__" : entry.folder.id)}
    {#if entry.type === "root"}
      {@const isCollapsed = ui.isCollapsed("__root__")}
      <div class="tree-folder" data-folder-id="__root__">
        <FolderHeader
          kind="root"
          id="__root__"
          name={$_("sidebar.uncategorized")}
          count={rootSessions.length}
          {isCollapsed}
          {actions}
        />
        {#if !isCollapsed}
          <div class="tree-children">
            {#each rootSessions as s (s.id)}<SessionRow session={s} {actions} />{/each}
          </div>
        {/if}
      </div>
    {:else}
      {@const folder = entry.folder}
      {@const sessions = getSessionsForFolder(folder.id, ui.searchQuery)}
      {@const isCollapsed = ui.isCollapsed(folder.id)}
      <div class="tree-folder" data-folder-id={folder.id}>
        <FolderHeader
          kind="folder"
          id={folder.id}
          name={folder.name}
          count={sessions.length}
          {isCollapsed}
          {actions}
        />
        {#if !isCollapsed}
          <div class="tree-children">
            {#each sessions as s (s.id)}<SessionRow session={s} {actions} />{/each}
          </div>
        {/if}
      </div>
    {/if}
  {/each}

  {#each flatRootSessions as s (s.id)}<SessionRow session={s} {actions} />{/each}
{/if}
