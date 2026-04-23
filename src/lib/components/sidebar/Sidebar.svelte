<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import { ui } from "../../stores/ui.svelte";
  import { dataStore } from "../../stores/data.svelte";
  import Tree from "./Tree.svelte";
  import { treeDragDrop } from "../../dnd/treeDnd";
  import type { SidebarActions } from "./types";

  let {
    sidebarEl = $bindable(),
    actions,
    onAddSession,
    onAddFolder,
    onSettings,
    onRefresh,
    onToggleHide,
  }: {
    sidebarEl?: HTMLElement;
    actions: SidebarActions;
    onAddSession: () => void;
    onAddFolder: () => void;
    onSettings: () => void;
    onRefresh: () => void;
    onToggleHide: () => void;
  } = $props();

  function handleSearchInput(e: Event) {
    ui.setSearchQuery((e.currentTarget as HTMLInputElement).value);
  }

  function handleNewWinChange(e: Event) {
    ui.setGlobalNewWindow((e.currentTarget as HTMLInputElement).checked);
  }
</script>

<aside id="sidebar" bind:this={sidebarEl} style="width: {ui.sidebarWidth}px">
  <div class="sidebar-top">
    <div class="search-wrap">
      <span class="search-icon">{@html ICONS.search}</span>
      <input
        type="text"
        id="search"
        placeholder={$_("sidebar.search.placeholder")}
        value={ui.searchQuery}
        oninput={handleSearchInput}
      />
    </div>
    <button
      class="btn-ghost-sm"
      id="sidebar-hide-btn"
      title={$_("sidebar.actions.hide")}
      onclick={onToggleHide}
    >{@html ICONS.chevronLeft}</button>
  </div>

  <div id="content-area" class="tree-list" use:treeDragDrop>
    <Tree {actions} />
  </div>

  <div class="sidebar-bottom">
    <div class="sidebar-actions">
      <button class="btn-secondary-sm" id="add-session-btn" onclick={onAddSession}>
        {@html ICONS.plus}<span>{$_("sidebar.actions.addSession")}</span>
      </button>
      <button class="btn-secondary-sm" id="add-folder-btn" onclick={onAddFolder}>
        {@html ICONS.folder}<span>{$_("sidebar.actions.addFolder")}</span>
      </button>
      <div class="sidebar-actions-spacer"></div>
      <label class="toggle-global-nw" title={$_("sidebar.actions.newWindowTitle")}>
        <input
          type="checkbox"
          id="global-newwin"
          checked={ui.globalNewWindow}
          onchange={handleNewWinChange}
        />
        <span class="toggle-mini-track"><span class="toggle-mini-thumb"></span></span>
        <span class="toggle-label-text">{$_("sidebar.actions.newWindow")}</span>
      </label>
      <button
        class="btn-ghost-sm"
        id="settings-btn"
        title={$_("sidebar.actions.settings")}
        onclick={onSettings}
      >{@html ICONS.settings}</button>
      <button
        class="btn-ghost-sm"
        id="refresh-btn"
        title={$_("sidebar.actions.refresh")}
        onclick={onRefresh}
      >{@html ICONS.refresh}</button>
    </div>
    <div class="stats" id="stats">
      {$_("sidebar.stats", { values: { folders: dataStore.folders.length, sessions: dataStore.sessions.length } })}
    </div>
  </div>
</aside>
