<script lang="ts">
  import { _ } from "svelte-i18n";
  import { type TabData, terminalStore, MAX_PANES_PER_TAB } from "../../stores/terminals.svelte";
  import {
    setActiveTab,
    closeTab,
    duplicateFromPane,
    splitActiveSameSession,
    openSessionPicker,
    toggleBroadcastForTab,
  } from "../../terminal/operations";
  import { t } from "../../i18n";
  import { mountContextMenu } from "../modals/mount";
  import { TERM_CLOSE_SVG } from "./icons";
  import type { ContextMenuItem } from "../sidebar/types";

  let { tab }: { tab: TabData } = $props();

  const isActive = $derived(terminalStore.activeTabId === tab.id);
  const displayTitle = $derived(
    tab.panes.length === 1 ? tab.panes[0].title : tab.panes[0]?.title ?? ""
  );

  function handleClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest(".tab-close")) return;
    setActiveTab(tab.id);
  }

  function handleClose(e: MouseEvent) {
    e.stopPropagation();
    void closeTab(tab.id);
  }

  function handleAuxClick(e: MouseEvent) {
    if (e.button === 1) void closeTab(tab.id);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ap = tab.panes.find(p => p.id === tab.focusedPaneId) ?? tab.panes[0];
    const items: ContextMenuItem[] = [];
    if (ap && ap.sshArgs.length > 0) {
      items.push({
        label: t("terminal.menu.duplicateSameWindow"),
        action: () => void duplicateFromPane(ap, false),
      });
      items.push({
        label: t("terminal.menu.duplicateNewWindow"),
        action: () => void duplicateFromPane(ap, true),
      });
      if (tab.panes.length < MAX_PANES_PER_TAB) {
        items.push({ label: "-", action: () => {} });
        items.push({
          label: t("terminal.menu.splitVerticalSame"),
          action: () => { setActiveTab(tab.id); splitActiveSameSession(); },
        });
        items.push({
          label: t("terminal.menu.splitVerticalOther"),
          action: () => { setActiveTab(tab.id); void openSessionPicker(); },
        });
      }
      items.push({ label: "-", action: () => {} });
    }
    if (tab.panes.length > 1) {
      items.push({
        label: tab.broadcast ? t("terminal.menu.broadcastOff") : t("terminal.menu.broadcastOn"),
        action: () => toggleBroadcastForTab(tab.id),
      });
      items.push({ label: "-", action: () => {} });
    }
    items.push({ label: t("terminal.menu.closeTab"), action: () => void closeTab(tab.id), danger: true });
    mountContextMenu(e.clientX, e.clientY, items);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="tab"
  class:active={isActive}
  class:broadcast={tab.broadcast}
  data-tab-id={tab.id}
  draggable="true"
  onclick={handleClick}
  onauxclick={handleAuxClick}
  oncontextmenu={handleContextMenu}
  role="button"
  tabindex="0"
>
  <span class="tab-broadcast" title="broadcast"></span>
  <span class="tab-title">{displayTitle}</span>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <span
    class="tab-close"
    title={$_("terminal.tab.close")}
    onclick={handleClose}
    role="button"
    tabindex="0"
  >{@html TERM_CLOSE_SVG}</span>
</div>
