<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import { ui } from "../../stores/ui.svelte";
  import { dndState } from "../../dnd/state.svelte";
  import { mountContextMenu } from "../modals/mount";
  import type { SidebarActions, ContextMenuItem } from "./types";

  let { kind, id, name, count, isCollapsed, actions }: {
    kind: "root" | "folder";
    id: string;
    name: string;
    count: number;
    isCollapsed: boolean;
    actions: SidebarActions;
  } = $props();

  function onClick(e: MouseEvent) {
    if (dndState.justFinished) return;
    if ((e.target as HTMLElement).closest("[data-action]")) return;
    if ((e.target as HTMLElement).closest(".drag-handle")) return;
    ui.toggleFolder(id);
  }

  function onContextMenu(e: MouseEvent) {
    if (kind === "root") return;
    if (dndState.justFinished) return;
    e.preventDefault();
    const items: ContextMenuItem[] = [
      { label: $_("sidebar.menu.folder.addSession"), icon: ICONS.plus, action: () => actions.addInFolder(id) },
      { label: $_("sidebar.menu.folder.edit"), icon: ICONS.edit, action: () => { void actions.editFolder(id); } },
      { label: "-", action: () => {} },
      { label: $_("sidebar.menu.folder.delete"), icon: ICONS.trash, action: () => { void actions.deleteFolder(id); }, danger: true },
    ];
    mountContextMenu(e.clientX, e.clientY, items);
  }

  // Props are read once; immutable for the lifetime of this row instance.
  // svelte-ignore state_referenced_locally
  const folderIdForAdd = kind === "root" ? null : id;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="tree-folder-header"
  class:tree-folder-root={kind === "root"}
  data-folder-toggle={id}
  onclick={onClick}
  oncontextmenu={onContextMenu}
  role="button"
  tabindex="0"
>
  <div class="drag-handle">{@html ICONS.drag}</div>
  <span class="folder-chevron">{@html isCollapsed ? ICONS.chevronRight : ICONS.chevronDown}</span>
  {#if kind === "folder"}
    <span class="folder-icon">{@html ICONS.folder}</span>
    <span class="folder-name">{name}</span>
  {:else}
    <span class="folder-name folder-name-dim">{name}</span>
  {/if}
  <span class="folder-count">({count})</span>
  <div class="folder-actions">
    <button
      class="btn-sm btn-add-in-folder"
      data-action="add-in-folder"
      title={$_("sidebar.folder.addSession")}
      onclick={(e) => { e.stopPropagation(); actions.addInFolder(folderIdForAdd); }}
    >{@html ICONS.plus}</button>
    {#if kind === "folder"}
      <button
        class="btn-sm btn-edit-sm"
        data-action="edit-folder"
        title={$_("sidebar.folder.edit")}
        onclick={(e) => { e.stopPropagation(); void actions.editFolder(id); }}
      >{@html ICONS.edit}</button>
    {/if}
  </div>
</div>
