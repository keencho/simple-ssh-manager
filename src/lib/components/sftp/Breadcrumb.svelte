<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import { listChildDirs, gotoPath, loadDir } from "../../sftp/operations";
  import type { RemoteEntry } from "../../api/types";

  let {
    panelId,
    sessionId,
    currentDir,
  }: {
    panelId: string;
    sessionId: string;
    currentDir: string;
  } = $props();

  const segments = $derived.by(() => {
    const parts = currentDir.split("/").filter(Boolean);
    let path = "";
    return parts.map((name) => {
      path += "/" + name;
      return { name, path };
    });
  });

  let dropdownEl: HTMLElement | null = $state(null);
  let dropdownLeft = $state(0);
  let dropdownTop = $state(0);
  let dropdownLoading = $state(false);
  let dropdownEntries = $state<RemoteEntry[]>([]);
  let dropdownError = $state(false);
  let dropdownOpen = $state(false);

  async function openDropdown(e: MouseEvent, dirPath: string) {
    e.stopPropagation();
    closeDropdown();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dropdownLeft = rect.left;
    dropdownTop = rect.bottom + 4;
    dropdownLoading = true;
    dropdownError = false;
    dropdownEntries = [];
    dropdownOpen = true;

    try {
      dropdownEntries = await listChildDirs(sessionId, dirPath);
      dropdownLoading = false;
    } catch {
      dropdownLoading = false;
      dropdownError = true;
    }
  }

  function closeDropdown() {
    dropdownOpen = false;
    dropdownEntries = [];
    dropdownLoading = false;
    dropdownError = false;
  }

  function handleSegmentDblClick(e: MouseEvent, path: string) {
    e.stopPropagation();
    closeDropdown();
    void loadDir(panelId, path);
  }

  function handleDropdownPick(path: string) {
    closeDropdown();
    void loadDir(panelId, path);
  }

  function handleDocumentMouseDown(e: MouseEvent) {
    if (!dropdownOpen) return;
    if (dropdownEl && dropdownEl.contains(e.target as Node)) return;
    closeDropdown();
  }

  $effect(() => {
    if (!dropdownOpen) return;
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  });

  // Close dropdown on dir change
  $effect(() => {
    void currentDir;
    closeDropdown();
  });
</script>

<div class="sftp-breadcrumb">
  {#each segments as seg, i (seg.path)}
    {#if i > 0}<span class="sftp-bc-sep">/</span>{/if}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <span
      class="sftp-bc-item"
      data-path={seg.path}
      role="button"
      tabindex="0"
      onclick={(e) => openDropdown(e, seg.path)}
      ondblclick={(e) => handleSegmentDblClick(e, seg.path)}
    >{seg.name}</span>
  {/each}
  <button
    class="sftp-bc-goto"
    title={$_("sftp.breadcrumb.gotoTitle")}
    onclick={() => void gotoPath(panelId)}
  >{@html ICONS.edit}</button>
</div>

{#if dropdownOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="sftp-bc-dropdown"
    bind:this={dropdownEl}
    style="left: {dropdownLeft}px; top: {dropdownTop}px"
  >
    {#if dropdownLoading}
      <div class="sftp-bc-dropdown-loading">{$_("sftp.breadcrumb.loading")}</div>
    {:else if dropdownError}
      <div class="sftp-bc-dropdown-empty">{$_("sftp.breadcrumb.loadFailed")}</div>
    {:else if dropdownEntries.length === 0}
      <div class="sftp-bc-dropdown-empty">{$_("sftp.breadcrumb.empty")}</div>
    {:else}
      {#each dropdownEntries as d (d.path)}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="sftp-bc-dropdown-item"
          onclick={() => handleDropdownPick(d.path)}
        >{@html ICONS.folderOpen} {d.name}</div>
      {/each}
    {/if}
  </div>
{/if}
