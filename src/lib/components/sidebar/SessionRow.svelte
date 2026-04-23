<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import { ui } from "../../stores/ui.svelte";
  import { dndState } from "../../dnd/state.svelte";
  import { mountContextMenu } from "../modals/mount";
  import type { SshSession } from "../../api/types";
  import type { SidebarActions, ContextMenuItem } from "./types";

  let { session, actions }: { session: SshSession; actions: SidebarActions } = $props();

  function onDblClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest(".drag-handle")) return;
    actions.connect(session.id, ui.globalNewWindow);
  }

  function onContextMenu(e: MouseEvent) {
    if (dndState.justFinished) return;
    e.preventDefault();
    const items: ContextMenuItem[] = [
      { label: $_("sidebar.menu.session.connect"), icon: ICONS.terminal, action: () => actions.connect(session.id, ui.globalNewWindow) },
      { label: $_("sidebar.menu.session.connectNewWindow"), icon: ICONS.newWindow, action: () => actions.connect(session.id, true) },
      { label: $_("sidebar.menu.session.openSftp"), icon: ICONS.fileManager, action: () => actions.openSftp(session.id) },
      { label: "-", action: () => {} },
      { label: $_("sidebar.menu.session.edit"), icon: ICONS.edit, action: () => actions.editSession(session) },
      { label: $_("sidebar.menu.session.duplicate"), icon: ICONS.copy, action: () => { void actions.duplicateSession(session.id); } },
      { label: "-", action: () => {} },
      { label: $_("sidebar.menu.session.delete"), icon: ICONS.trash, action: () => { void actions.deleteSession(session.id); }, danger: true },
    ];
    mountContextMenu(e.clientX, e.clientY, items);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="tree-session"
  data-session-id={session.id}
  ondblclick={onDblClick}
  oncontextmenu={onContextMenu}
  role="button"
  tabindex="0"
>
  <div class="drag-handle">{@html ICONS.drag}</div>
  <div class="row-icon">{@html ICONS.server}</div>
  <div class="row-body">
    <div class="row-title-line">
      <span class="row-name">{session.name}</span>
      {#if session.jump_host}
        <span class="row-meta-ic row-meta-jump" title={`via ${session.jump_host.host}`}>
          {@html ICONS.jump}
        </span>
      {/if}
    </div>
    <div class="row-connection">{session.user}@{session.host}:{session.port}</div>
  </div>
</div>
