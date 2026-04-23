<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { TERM_CLOSE_SVG } from "../terminal/icons";
  import type { Folder, SshSession } from "../../api/types";

  let {
    folders,
    sessions,
    onSelect,
    onClose,
  }: {
    folders: Folder[];
    sessions: SshSession[];
    onSelect: (sessionId: string) => void;
    onClose: () => void;
  } = $props();

  let query = $state("");
  let searchEl: HTMLInputElement;

  function folderOf(id: string | null): string {
    if (!id) return $_("terminal.picker.uncategorized");
    return folders.find((f) => f.id === id)?.name ?? $_("terminal.picker.uncategorized");
  }

  const filtered = $derived.by(() => {
    const q = query.toLowerCase();
    return sessions
      .slice()
      .sort((a, b) => a.order - b.order)
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.host.toLowerCase().includes(q) ||
          folderOf(s.folder_id).toLowerCase().includes(q)
        );
      });
  });

  function handleOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  function handlePick(id: string) {
    onSelect(id);
    onClose();
  }

  onMount(() => {
    searchEl?.focus();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="picker-overlay"
  onmousedown={handleOverlayMouseDown}
  role="dialog"
  tabindex="-1"
>
  <div class="picker-modal">
    <div class="picker-header">
      <span class="picker-title">{$_("terminal.picker.title")}</span>
      <button
        class="picker-close"
        title={$_("terminal.picker.close")}
        onclick={onClose}
      >{@html TERM_CLOSE_SVG}</button>
    </div>
    <input
      class="picker-search"
      type="text"
      placeholder={$_("terminal.picker.search")}
      bind:value={query}
      bind:this={searchEl}
    />
    <div class="picker-list">
      {#if filtered.length === 0}
        <div class="picker-empty">{$_("terminal.picker.empty")}</div>
      {:else}
        {#each filtered as s (s.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="picker-item"
            data-session-id={s.id}
            onclick={() => handlePick(s.id)}
            role="button"
            tabindex="0"
          >
            <div class="picker-item-folder">{folderOf(s.folder_id)}</div>
            <div class="picker-item-name">{s.name}</div>
            <div class="picker-item-host">{s.user}@{s.host}:{s.port}</div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
