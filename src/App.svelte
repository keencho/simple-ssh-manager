<script lang="ts">
  import Sidebar from "./lib/components/sidebar/Sidebar.svelte";
  import Resizer from "./lib/components/sidebar/Resizer.svelte";
  import EdgeTrigger from "./lib/components/sidebar/EdgeTrigger.svelte";
  import TerminalArea from "./lib/components/terminal/TerminalArea.svelte";
  import SftpPanels from "./lib/components/sftp/SftpPanels.svelte";
  import { ui } from "./lib/stores/ui.svelte";

  import type { SidebarActions } from "./lib/components/sidebar/types";

  let {
    actions,
    onAddSession,
    onAddFolder,
    onSettings,
    onRefresh,
    onToggleHide,
  }: {
    actions: SidebarActions;
    onAddSession: () => void;
    onAddFolder: () => void;
    onSettings: () => void;
    onRefresh: () => void;
    onToggleHide: () => void;
  } = $props();

  let sidebarEl: HTMLElement | undefined = $state();

  $effect(() => {
    document.body.classList.toggle("sidebar-right", ui.sidebarPosition === "right");
    document.body.classList.toggle("sidebar-hidden", ui.sidebarHidden);
    window.dispatchEvent(new Event("resize"));
  });
</script>

<div id="app-layout">
  <Sidebar
    bind:sidebarEl
    {actions}
    {onAddSession}
    {onAddFolder}
    {onSettings}
    {onRefresh}
    {onToggleHide}
  />
  <Resizer sidebarEl={sidebarEl ?? null} />
  <div id="terminal-area">
    <TerminalArea />
  </div>
</div>
<EdgeTrigger onToggle={onToggleHide} />
<SftpPanels />
